# Registro de Decisiones de Arquitectura (ADR) — Sistema C5

Este documento registra las decisiones arquitectónicas relevantes tomadas durante el diseño e implementación del Sistema de Alerta Ciudadana C5, incluyendo el contexto que motivó cada decisión, las alternativas consideradas y la justificación de la opción elegida.

---

## ADR-1: Comunicación síncrona entre MS2 y MS3 vía gRPC

**Estado:** Aceptado

**Contexto**

El sistema requiere que al menos un par de microservicios se comuniquen mediante gRPC con contrato `.proto` definido (RNF-4). MS2 (Geolocalización) necesita el resultado de clasificación de MS3 (Prioridad) antes de continuar el pipeline — es una dependencia síncrona y bloqueante por naturaleza: no tiene sentido persistir un incidente sin su nivel de prioridad.

**Alternativas consideradas**

| Opción | Descripción | Por qué se descartó |
|---|---|---|
| REST entre MS2 y MS3 | HTTP/JSON tradicional | Cumple el requisito mínimo, pero no aprovecha el contrato fuertemente tipado que exige gRPC; mayor overhead de serialización JSON en una ruta crítica de latencia |
| Comunicación vía Redis (asíncrona) | MS2 publica, MS3 consume y republica resultado | Rompe la naturaleza síncrona de la necesidad (MS2 necesita la prioridad *antes* de persistir) y agrega complejidad de correlación de mensajes sin beneficio real |
| gRPC entre MS2 y MS3 | RPC binario con contrato `.proto` | **Elegida** |

**Decisión**

Se implementa gRPC unidireccional: MS2 actúa como cliente, MS3 como servidor, con el contrato definido en `services/ms3/proto/priority.proto`. El servicio expone un único RPC, `ClassifyAlert`, que recibe los datos geolocalizados y retorna el nivel de prioridad.

**Justificación**

- Contrato fuertemente tipado vía Protocol Buffers reduce errores de integración entre equipos que trabajan en distintos lenguajes (MS2 en Python, MS3 en Node.js).
- Serialización binaria de protobuf es más eficiente que JSON para una llamada que ocurre en el camino crítico de latencia (RF-1: < 2 segundos end-to-end).
- gRPC soporta timeouts nativos (`timeout=2.0` en el cliente), lo que permite degradar con seguridad ante un MS3 lento sin bloquear indefinidamente el pipeline.

**Consecuencias**

- Si MS3 no responde dentro de 2 segundos o falla, MS2 aplica un valor de prioridad por defecto (`"medio"`) en lugar de perder la alerta. Esto prioriza disponibilidad sobre precisión de clasificación en escenarios de fallo — una alerta mal clasificada es preferible a una alerta perdida.
- Cada servicio mantiene su propia copia del archivo `.proto` (en `services/ms2/proto/` y `services/ms3/proto/`) porque cada uno se construye en un contexto de Docker aislado. En un monorepo con tooling más maduro, esto se resolvería con un paquete compartido o submódulo; para el alcance de este proyecto, mantener ambas copias sincronizadas manualmente es la solución más simple y transparente.

---

## ADR-2: Redis Streams con Consumer Groups para tolerancia a fallos

**Estado:** Aceptado

**Contexto**

El sistema debe garantizar que ninguna alerta se pierda incluso si uno o más nodos fallan (RNF-1), y específicamente debe demostrarse en vivo que si el microservicio de Notificaciones (MS4) cae, las alertas no se pierden y se entregan al recuperarse.

**Alternativas consideradas**

| Opción | Descripción | Por qué se descartó |
|---|---|---|
| Redis Pub/Sub | Publicación/suscripción estándar de Redis | **No persiste mensajes.** Si el suscriptor está caído en el momento de la publicación, el mensaje se pierde irrecuperablemente. Incompatible con el requisito de tolerancia a fallos. |
| Redis List (`LPUSH`/`BRPOP`) | Cola simple basada en listas | Persiste mensajes, pero no soporta múltiples consumidores independientes leyendo el mismo flujo sin competir entre sí (no hay noción de "grupo de consumo"); tampoco ofrece reconocimiento (ACK) explícito ni mecanismo de mensajes pendientes |
| Redis Streams + Consumer Groups | Estructura de log append-only con `XADD`/`XREADGROUP`/`XACK` | **Elegida** |
| Apache Kafka / RabbitMQ | Brokers de mensajería dedicados | Sobre-ingeniería para el alcance del examen; añade infraestructura adicional sin beneficio proporcional, dado que Redis ya es una pieza obligatoria del stack |

**Decisión**

Se usan dos Redis Streams independientes:
- `alerts-stream`: de MS1 hacia MS2 (ingesta cruda)
- `notifications-stream`: de MS2 hacia MS4 (notificaciones ya clasificadas)

Ambos con consumer groups (`ms2-group`, `ms4-group`) y reconocimiento explícito (`XACK`) solo después de procesamiento exitoso.

**Justificación**

- Los mensajes persisten en el stream independientemente de si hay consumidores activos — un mensaje publicado mientras MS4 está caído permanece en `notifications-stream` indefinidamente hasta ser reclamado.
- Al reiniciar un consumidor, `XREADGROUP` con el ID `>` automáticamente entrega los mensajes no reconocidos (pendientes) antes de continuar con mensajes nuevos — no requiere lógica adicional de recuperación.
- El ACK ocurre **después** de completar el procesamiento (persistencia en PostgreSQL para MS2; emisión por WebSocket para MS4), no al recibir el mensaje. Esto significa que si el servicio muere a mitad de procesamiento, el mensaje permanece en la lista de pendientes (`XPENDING`) y se puede reentregar.

**Consecuencias**

- Se acepta la posibilidad de procesamiento duplicado en escenarios de fallo a mitad de transacción (ej. MS2 persiste en PostgreSQL pero muere antes de hacer ACK). Se mitiga con `ON CONFLICT DO NOTHING` sobre `stream_id` en la tabla `incidents`, haciendo la inserción idempotente.
- Validado en demo: al detener MS4, las alertas se acumulan en `notifications-stream` (confirmado con `XLEN` y `XPENDING`); al reiniciar MS4, se procesan automáticamente en los primeros milisegundos sin pérdida ni intervención manual.

---

## ADR-3: Diccionario de reglas estático para clasificación de prioridad (NLP descartado)

**Estado:** Aceptado — supersede una decisión previa

**Contexto**

El sistema requiere clasificar automáticamente las alertas en tres niveles de prioridad con reglas documentadas (RF-3), respetando el límite de 2 segundos end-to-end (RF-1).

Durante el diseño se evaluó usar Procesamiento de Lenguaje Natural (NLP) — específicamente clasificación zero-shot sobre un campo de texto libre (`description`) — como mecanismo de clasificación, sugerido como posible enfoque a explorar.

**Alternativas consideradas**

| Opción | Descripción | Por qué se descartó |
|---|---|---|
| NLP zero-shot (`facebook/bart-large-mnli`) | Modelo de ~1.6GB, clasifica texto libre sin entrenamiento previo | Inferencia de 3–8 segundos en CPU sin GPU — **viola directamente RF-1** (límite de 2s end-to-end) |
| NLP zero-shot ligero (`cross-encoder/nli-MiniLM2-L6-H768`) | Modelo de ~80MB, mismo enfoque pero más liviano | Viable en latencia (~400ms) pero introduce una dependencia pesada (PyTorch/Transformers), mayor superficie de fallo, y complejidad de despliegue desproporcionada para el alcance y el tiempo disponible del proyecto |
| Captura de audio + transcripción de voz | El ESP32 captura audio del usuario hablando | **Inviable técnicamente**: el ESP32 (320KB RAM, 240MHz) no tiene capacidad de cómputo para procesar audio ni ejecutar modelos de speech-to-text; tampoco MQTT está diseñado para streaming de audio (límite práctico de payload muy por debajo del tamaño de un clip de voz) |
| Diccionario estático de reglas (`emergency_type` → prioridad) | Mapeo directo en código, definido por el equipo | **Elegida** |

**Decisión**

MS3 implementa un diccionario de JavaScript que mapea directamente el campo `emergency_type` del payload a un nivel de prioridad fijo:

```js
const priorityRules = {
  "panico":      "critico",
  "robo":        "critico",
  "agresion":    "critico",
  "accidente":   "alto",
  "incendio":    "alto",
  "sospechoso":  "medio",
  "ruido":       "medio",
};
```

Con un valor por defecto (`"medio"`) para cualquier tipo no reconocido, garantizando que ninguna alerta quede sin clasificar.

**Justificación**

- Cumple RF-3 (reglas documentadas) de forma directa y auditable: el código del diccionario *es* la documentación de las reglas.
- Latencia de clasificación: microsegundos (acceso a diccionario en memoria) — sin riesgo de violar RF-1 bajo ninguna condición de carga o hardware.
- Cero dependencias externas, cero puntos de fallo adicionales, cero complejidad de despliegue — apropiado para el tiempo y alcance disponibles del examen.
- El campo `emergency_type` se define como un valor controlado y acordado entre el equipo (quien construye el ESP32) y el equipo de MS3 (quien define el diccionario) — es un contrato explícito, no una inferencia probabilística.

**Consecuencias**

- El sistema no puede clasificar texto libre o descripciones no estructuradas; depende de que el dispositivo emisor (ESP32) envíe un `emergency_type` válido y coordinado de antemano con el diccionario de MS3.
- Esta decisión prioriza explícitamente **cumplir el requisito de latencia (RF-1) y la viabilidad de la demo** sobre la flexibilidad semántica que ofrecería un enfoque de NLP. Se documenta como un trade-off consciente: en un sistema de producción real, con tiempo y recursos de hardware GPU dedicados, NLP sería superior; para el alcance, plazo y restricciones de hardware del laboratorio, el diccionario estático es la opción correcta.

---

## ADR-4: Autenticación `trust` en PostgreSQL para el entorno de laboratorio

**Estado:** Aceptado — limitado al entorno de demo

**Contexto**

La replicación maestro-réplica de PostgreSQL requiere que la réplica se autentique contra el master mediante un rol de replicación (`replicator`). Configurar autenticación robusta (`scram-sha-256` con contraseñas) añade pasos de configuración (gestión de secretos, certificados o contraseñas compartidas entre contenedores) que consumen tiempo de desarrollo sin aportar valor demostrable en el contexto de un examen de laboratorio aislado.

**Alternativas consideradas**

| Opción | Descripción | Por qué se descartó (para este contexto) |
|---|---|---|
| `scram-sha-256` con contraseñas | Autenticación robusta estándar de producción | Requiere gestión adicional de secretos (variables de entorno sensibles, posible uso de Docker Secrets) — complejidad no justificada para un entorno Docker Compose local y temporal |
| `trust` (sin contraseña) | Cualquier conexión desde la red interna de Docker es aceptada | **Elegida**, con justificación explícita de alcance |

**Decisión**

`POSTGRES_HOST_AUTH_METHOD=trust` para todas las conexiones, incluyendo la entrada de replicación agregada manualmente a `pg_hba.conf` (`host replication replicator 0.0.0.0/0 trust`).

**Justificación**

- El entorno corre completamente dentro de una red Docker interna (`c5-network`), no expuesta a internet salvo los puertos explícitamente publicados para fines de desarrollo y demo.
- Reduce drásticamente el tiempo de configuración y la superficie de errores (gestión de contraseñas entre 12+ contenedores) en un proyecto con plazo de entrega de un día.
- Es una decisión **explícitamente no apta para producción**, y se documenta como tal para demostrar criterio técnico ante el jurado: se entiende el riesgo y se elige conscientemente por las restricciones del contexto académico.

**Consecuencias**

- Cualquier contenedor dentro de la red `c5-network` puede conectarse a PostgreSQL sin autenticación. En un despliegue real, esto se reemplazaría por `scram-sha-256`, rotación de credenciales, y restricción de `pg_hba.conf` a rangos de IP específicos en lugar de `0.0.0.0/0`.

---

## ADR-5: Escritura centralizada en MS2, lectura centralizada en MS5

**Estado:** Aceptado

**Contexto**

El sistema requiere réplica de lectura configurada en PostgreSQL, con las lecturas del historial dirigidas explícitamente a la réplica (RNF-3).

**Alternativas consideradas**

| Opción | Descripción | Por qué se descartó |
|---|---|---|
| Cada microservicio decide a qué nodo de PostgreSQL conectarse | Lógica de enrutamiento de lecturas/escrituras distribuida | Aumenta el riesgo de que un servicio futuro lea o escriba accidentalmente en el nodo incorrecto; viola el principio de responsabilidad única |
| MS2 escribe en master, MS5 lee de réplica (roles fijos por servicio) | Cada servicio tiene una única responsabilidad de E/S sobre la base de datos | **Elegida** |

**Decisión**

MS2 es el único servicio con permiso de escritura (`PG_HOST=postgres-master`). MS5 es el único servicio que lee el historial, y lo hace exclusivamente contra la réplica (`PG_HOST=postgres-replica`). Ningún otro servicio se conecta directamente a PostgreSQL.

**Justificación**

- Elimina por diseño la posibilidad de que las lecturas de historial compitan por recursos con las escrituras del pipeline crítico de alertas (RF-1).
- Hace explícito y auditable el modelo de consistencia elegido (ver documento de Modelo de Consistencia adjunto): cualquier lectura del historial es, por construcción, una lectura eventualmente consistente.

**Consecuencias**

- Ver documento separado `modelo-consistencia.md` para el análisis completo de las implicaciones de consistencia eventual.