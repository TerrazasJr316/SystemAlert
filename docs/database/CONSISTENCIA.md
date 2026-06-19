# Modelo de Consistencia de la Base de Datos — Sistema C5

## Resumen

El Sistema C5 implementa **consistencia eventual** entre el nodo maestro (`postgres-master`) y el nodo de réplica (`postgres-replica`) de PostgreSQL, mediante streaming replication asíncrona nativa. Este documento explica qué significa esa elección, por qué se tomó, y qué garantías ofrece y no ofrece al sistema.

---

## 1. Arquitectura de replicación

```
MS2 (Geolocalización)
        │  escribe (INSERT)
        ▼
postgres-master  ──── streaming replication (WAL) ────▶  postgres-replica
                       (asíncrona, vía pg_basebackup +
                        streaming WAL receiver)
                                                                  │
                                                                  ▼
                                                          MS5 (Historial)
                                                          lee (SELECT)
```

- **`postgres-master`** es el único nodo que acepta escrituras. Solo MS2 se conecta a él, y solo para insertar incidentes ya clasificados.
- **`postgres-replica`** es un nodo de solo lectura (`hot_standby = on`), que se mantiene sincronizado recibiendo continuamente el WAL (*Write-Ahead Log*) del master a través de una conexión de replicación dedicada.
- **`MS5`** (Historial) es el único servicio que lee de la base de datos, y lo hace exclusivamente contra la réplica — nunca contra el master.

Esta separación de roles (un escritor, un lector, nunca mezclados) es una decisión arquitectónica deliberada, documentada en `ADR-5`.

---

## 2. ¿Por qué consistencia eventual y no consistencia fuerte?

### Consistencia fuerte (la alternativa descartada)

Un modelo de consistencia fuerte garantizaría que, inmediatamente después de que MS2 confirma una escritura, **cualquier lectura posterior en cualquier nodo** (incluida la réplica) refleje ese dato exacto, sin ningún retraso. Esto normalmente se logra con:

- Replicación **síncrona** (el master espera confirmación de la réplica antes de confirmar la transacción al cliente), o
- Leer siempre del mismo nodo (eliminando la réplica como fuente de lectura), o
- Mecanismos de quorum (como los usados en bases de datos distribuidas tipo Raft/Paxos).

**Por qué se descartó:** la replicación síncrona introduce latencia adicional en cada escritura, porque el master debe esperar el acuse de recibo de la réplica antes de confirmar. En este sistema, las escrituras ocurren en el camino crítico del pipeline de alertas (MS1 → MS2 → PostgreSQL), que está sujeto al límite de **2 segundos end-to-end (RF-1)**. Agregar una dependencia síncrona de red entre dos nodos de base de datos en esa ruta introduce un riesgo innecesario de violar ese requisito, especialmente si la réplica experimenta latencia de red o está temporalmente lenta.

### Consistencia eventual (la opción elegida)

Con replicación **asíncrona**, el master confirma la escritura a MS2 tan pronto como la transacción se completa localmente, **sin esperar** a que la réplica la reciba. La réplica se actualiza tan pronto como puede, típicamente en el orden de milisegundos bajo condiciones normales de red, pero sin garantía de límite superior estricto.

Esto significa que existe una ventana de tiempo — habitualmente muy pequeña — durante la cual:

- El incidente ya existe en `postgres-master` (y por tanto el sistema ya lo considera "persistido" para efectos de tolerancia a fallos).
- El mismo incidente **todavía no existe** en `postgres-replica`, y por tanto una consulta a MS5 en ese instante exacto no lo devolvería.

---

## 3. Justificación: por qué esta ventana de inconsistencia es aceptable

El factor decisivo es **qué tipo de dato fluye por cada camino del sistema**, y qué pasa si ese dato llega con un pequeño retraso:

| Camino | Tipo de dato | Sensibilidad a consistencia fuerte |
|---|---|---|
| ESP32 → MQTT → MS1 → Redis → MS2 → MS3 → **PostgreSQL master** | Alerta de emergencia activa | **Alta** — pero esta ruta no depende de la réplica en absoluto. La urgencia operativa real (notificar al operador) ocurre vía `MS4` y WebSocket, **no** vía el historial. |
| **PostgreSQL réplica** → MS5 → Dashboard (historial) | Consulta de incidentes pasados, con filtros de fecha/zona/prioridad | **Baja** — el historial es, por naturaleza, un registro de eventos ya ocurridos. Un operador consultando "incidentes de la última hora" no se ve afectado de forma operativa si un incidente de hace 200 milisegundos todavía no aparece en esa consulta específica. |

En otras palabras: **el camino crítico de tiempo real del sistema (notificación al operador) no pasa por la réplica.** La notificación en tiempo real se entrega mediante `MS4` a través de Redis Streams y WebSocket — un camino completamente independiente de PostgreSQL. La réplica solo alimenta el módulo de **historial/auditoría** (`MS5`), donde un retraso de milisegundos no tiene impacto en la capacidad del operador de responder a una emergencia.

Esto es consistente con el RF-4, que exige notificaciones en tiempo real vía WebSocket — un requisito que el sistema cumple sin involucrar a la réplica de PostgreSQL en absoluto.

---

## 4. Garantías concretas que ofrece el sistema

- **Durabilidad**: una vez que MS2 recibe confirmación de escritura del master, el incidente está persistido de forma durable (sujeto a las garantías estándar de PostgreSQL — WAL fsync, etc.) y no se pierde, independientemente de si la réplica ya lo reflejó o no.
- **Disponibilidad de lectura**: el historial (MS5) sigue siendo consultable incluso si el master experimenta una carga alta de escrituras, porque las lecturas nunca compiten por los mismos recursos de I/O que las escrituras — están físicamente en nodos distintos.
- **Convergencia**: bajo condiciones normales de red (como las del entorno de laboratorio Docker, donde master y réplica están en la misma red interna de baja latencia), la ventana de inconsistencia es del orden de milisegundos. Se verificó empíricamente durante el desarrollo que una alerta insertada en el master es visible en la réplica de forma prácticamente inmediata al consultar manualmente ambos nodos en secuencia.

---

## 5. Qué pasa si el master cae

Es importante ser explícito sobre una limitación de este diseño: la replicación configurada es de **solo lectura** en la réplica (`hot_standby`), sin promoción automática (*failover* automático) a master en caso de que `postgres-master` falle.

Esto significa que:

- Si `postgres-master` cae, **las escrituras nuevas (nuevos incidentes) se detienen** — `MS2` no podrá persistir nuevas alertas hasta que el master se recupere. Esto está mitigado parcialmente por el diseño de `MS2`: si la escritura en PostgreSQL falla, el mensaje de Redis **no recibe ACK**, por lo que la alerta permanece seguramente encolada en `alerts-stream` y se reintentará automáticamente cuando el master vuelva a estar disponible — no se pierde el dato, solo se retrasa su persistencia.
- Las lecturas del historial (`MS5`) **continúan funcionando con normalidad** contra la réplica, mostrando todos los datos hasta el último punto sincronizado antes de la caída.

La promoción automática de réplica a master (failover automático, mediante herramientas como Patroni o repmgr) queda fuera del alcance de este proyecto, documentado como una limitación consciente dado el tiempo y los objetivos académicos del examen — el foco del requisito (RNF-3) es demostrar el modelo de replicación y consistencia, no construir un clúster de alta disponibilidad con failover automático de nivel productivo.
