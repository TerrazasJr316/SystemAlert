# ⚙️ Backend - Microservicios de Procesamiento

## ¿Qué es?

Los microservicios que reciben, procesan y guardan las alertas que llegan desde los dispositivos IoT (ESP32).

**Ubicación:** `/services`  
**Tecnología:** Node.js + Python + gRPC  
**Puertos:** 5000-5004 (cada microservicio)

---

## 🏗️ Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────┐
│              MS1: Recepción (Node.js)               │ Puerto 5001
│  - Recibe alertas desde Mosquitto MQTT              │
│  - Valida datos básicos                             │
├─────────────────────────────────────────────────────┤
│              MS2: Geolocalización (Python)          │ Puerto 5002
│  - Procesa coordenadas GPS                          │
│  - Enriquece con información geográfica             │
├─────────────────────────────────────────────────────┤
│              MS3: Prioridad (Python)                │ Puerto 5003
│  - Clasifica alertas por nivel de prioridad         │
│  - Guarda en PostgreSQL                             │
├─────────────────────────────────────────────────────┤
│           MS4: Notificaciones (Node.js)             │ Puerto 5004
│  - Envía alertas a operadores por WebSocket         │
├─────────────────────────────────────────────────────┤
│            MS5: Historial (Node.js)                 │ Puerto 5000
│  - API REST para consultar historial de alertas     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Cómo Ejecutar Todo

### Opción 1: Docker Compose (Recomendado)
```bash
docker-compose up -d
```

Esto levanta todos los servicios automáticamente.

### Opción 2: Individual en local

#### MS1 - Recepción
```bash
cd services/ms1
npm install
npm start
```

#### MS2 - Geolocalización
```bash
cd services/ms2
pip install -r requirements.txt
python main.py
```

#### MS3 - Prioridad
```bash
cd services/ms3
npm install
npm start
```

#### MS4 - Notificaciones
```bash
cd services/ms4
npm install
npm start
```

#### MS5 - Historial
```bash
cd services/ms5
npm install
npm start
```

---

## 🎯 ¿Qué Hace Cada Servicio?

### MS1: Recepción ⬇️
**Ubicación:** `/services/ms1`

**Función:**
- Escucha en Mosquitto MQTT (puerto 1883)
- Recibe mensajes de los ESP32
- Valida que los datos sean correctos
- Envía los datos a MS2

**Estructura de mensaje esperado:**
```json
{
  "device_id": "esp32_001",
  "latitude": 25.6867,
  "longitude": -100.3161,
  "alert_type": "PÁNICO",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Archivo principal:** `index.js`

---

### MS2: Geolocalización 📍
**Ubicación:** `/services/ms2`

**Función:**
- Recibe coordenadas GPS desde MS1
- Busca información de la zona (zona, municipio, etc.)
- Enriquece el mensaje con datos geográficos
- Envía a MS3

**Archivo principal:** `main.py`

**Ejemplo de enriquecimiento:**
```python
# Entrada
{"latitude": 25.6867, "longitude": -100.3161}

# Salida
{
  "latitude": 25.6867,
  "longitude": -100.3161,
  "zona": "Centro",
  "municipio": "Monterrey",
  "estado": "Nuevo León"
}
```

---

### MS3: Prioridad 🎯
**Ubicación:** `/services/ms3`

**Función:**
- Recibe alerta enriquecida desde MS2
- Clasifica por prioridad (BAJA, MEDIA, ALTA, CRÍTICA)
- Aplica reglas de negocio (ej: botón pánico = CRÍTICA)
- Guarda en PostgreSQL
- Envía a Redis para que MS4 la entregue

**Reglas básicas:**
```
BOTÓN PÁNICO → CRÍTICA
ZONA DE ALTO RIESGO → ALTA
ZONA NORMAL → MEDIA/BAJA
```

**Archivo principal:** `index.js`

---

### MS4: Notificaciones 📤
**Ubicación:** `/services/ms4`

**Función:**
- Escucha Redis para nuevas alertas
- Conecta con el frontend por WebSocket
- Envía alertas en tiempo real a operadores
- Mantiene historial en memoria

**WebSocket Events:**
```javascript
socket.on('nueva_alerta', (data) => {
  // Frontend recibe la alerta
  console.log('Alerta recibida:', data);
});
```

**Archivo principal:** `index.js`

---

### MS5: Historial 📊
**Ubicación:** `/services/ms5`

**Función:**
- Ofrece API REST para consultar alertas pasadas
- Conecta a PostgreSQL (REPLICA) para no saturar master
- Filtros: por fecha, zona, tipo, prioridad
- Retorna JSON

**Endpoints disponibles:**
```bash
GET  /alertas                    # Todas las alertas
GET  /alertas?fecha=2024-01-15   # Por fecha
GET  /alertas?zona=Centro        # Por zona
GET  /alertas?tipo=PÁNICO        # Por tipo
GET  /alertas/:id                # Detalle de una alerta
```

**Archivo principal:** `index.js`

---

## 🗄️ Base de Datos

### PostgreSQL
**Tabla principal:** `alertas`

```sql
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  alert_type VARCHAR(50),
  priority VARCHAR(20),
  zona VARCHAR(100),
  municipio VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'RECIBIDA'
);
```

**Acceso:**
- **Master (escritura):** ms3 escribe aquí
- **Replica (lectura):** ms5 lee desde aquí

### Redis
**Uso:** Buffer de alertas en tiempo real

```bash
# Ver alertas en Redis
redis-cli
> KEYS *
> LRANGE alertas 0 -1  # Últimas alertas
> HGETALL alerta:1     # Detalle de una alerta
```

---

## 🔧 Configuración Básica

### Variables de Entorno

Crea un `.env` en cada servicio:

#### MS1 (Recepción)
```env
MQTT_HOST=mosquitto
MQTT_PORT=1883
MS2_HOST=ms2
MS2_PORT=5002
```

#### MS2 (Geolocalización)
```env
MS3_HOST=ms3
MS3_PORT=5003
PYTHON_ENV=production
```

#### MS3 (Prioridad)
```env
REDIS_HOST=redis
REDIS_PORT=6379
POSTGRES_HOST=postgres-master
POSTGRES_DB=alertas_c5
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
```

#### MS4 (Notificaciones)
```env
REDIS_HOST=redis
REDIS_PORT=6379
PORT=5004
```

#### MS5 (Historial)
```env
POSTGRES_HOST=postgres-replica
POSTGRES_DB=alertas_c5
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
PORT=5000
```

---

## 📊 Flujo de Datos Ejemplo

```
1. ESP32 envía: {"device_id":"esp32_001", "lat":25.6867, "lon":-100.3161}
              ↓
2. MS1 recibe por MQTT, valida y envía a MS2
              ↓
3. MS2 enriquece: agrega zona, municipio
              ↓
4. MS3 calcula prioridad: CRÍTICA (botón pánico)
              ↓
5. MS3 guarda en PostgreSQL y publica en Redis
              ↓
6. MS4 escucha Redis y envía por WebSocket al frontend
              ↓
7. Frontend muestra alerta en el mapa
              ↓
8. MS5 guarda en historial para búsquedas posteriores
```

---

## 🛠️ Tareas Comunes

### Ver logs de un servicio
```bash
docker-compose logs -f ms3
```

### Conectarse a la BD
```bash
docker-compose exec postgres-master psql -U admin -d alertas_c5
```

**Comandos útiles en SQL:**
```sql
-- Ver todas las alertas
SELECT * FROM alertas LIMIT 10;

-- Alertas críticas de hoy
SELECT * FROM alertas WHERE priority='CRÍTICA' AND DATE(created_at)=CURRENT_DATE;

-- Contar por zona
SELECT zona, COUNT(*) FROM alertas GROUP BY zona;
```

### Monitorear Redis
```bash
docker-compose exec redis redis-cli
> MONITOR          # Ver comandos en tiempo real
> INFO             # Estadísticas
> KEYS *           # Ver todas las claves
```

### Restar servicios
```bash
docker-compose restart ms3     # Reiniciar MS3
docker-compose restart          # Reiniciar todos
```

---

## 🐛 Problemas Comunes

### Las alertas no llegan a MS1
```bash
# Verifica conexión MQTT
docker-compose logs -f mosquitto

# Prueba conectarse manualmente:
docker-compose exec -it mosquitto mosquitto_sub -h mosquitto -t "#"
```

### MS2 no enriquece datos
```bash
# Verifica que el servicio está corriendo
docker-compose logs -f ms2

# Prueba el endpoint
curl http://localhost:5002/health
```

### Las alertas no se guardan en BD
```bash
# Verifica conexión a PostgreSQL
docker-compose logs -f ms3

# Revisa permisos en PostgreSQL
docker-compose exec postgres-master psql -U admin -d alertas_c5
```

### Frontend no recibe alertas en tiempo real
```bash
# Verifica que MS4 está corriendo
docker-compose logs -f ms4

# Verifica WebSocket en consola del navegador (F12)
```

---

## 📈 Escalabilidad

### Aumentar instancias de MS1
Edita `docker-compose.yml`:
```yaml
ms1:
  deploy:
    replicas: 5  # Aumentar de 3 a 5
```

Luego: `docker-compose up -d`

---

## 💾 Backup de Datos

```bash
# Hacer backup de PostgreSQL
docker-compose exec postgres-master pg_dump -U admin -d alertas_c5 > backup.sql

# Restaurar
docker-compose exec -T postgres-master psql -U admin -d alertas_c5 < backup.sql
```

---

## 📞 Debugging

### Habilitar logs detallados
En cada `index.js` o `main.py`, agrega:

```javascript
console.log('[MS3]', 'Alerta recibida:', data);
```

```python
print(f'[MS2] Procesando coordenadas: {lat}, {lon}')
```

### Monitorear tráfico MQTT
```bash
# En otra terminal
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v
```

---

## 🎓 Próximos Pasos

1. **Entender el flujo completo:** Revisa el README principal
2. **Probar cambios locales:** Ejecuta un servicio manualmente
3. **Ver datos en BD:** Conectate a PostgreSQL y consulta
4. **Agregar reglas:** Edita MS3 para nuevas prioridades
5. **Integrar notificaciones:** Conecta MS4 con SMS/Email

---

**¿Necesitas más ayuda?** Revisa los archivos de cada microservicio dentro de `/services`
