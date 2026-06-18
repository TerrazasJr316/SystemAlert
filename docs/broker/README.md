# 📨 Broker MQTT - Comunicación IoT

## ¿Qué es?

El **Broker MQTT** es el intermediario que recibe los mensajes de los dispositivos IoT (ESP32 con GPS) y los distribuye a los microservicios para procesarlos.

Es como un "buzón de correos" central donde todos depositan sus mensajes.

**Ubicación:** `/mosquitto`  
**Tecnología:** Mosquitto (broker MQTT ligero)  
**Puertos:** 
- `1883` - MQTT (conexión normal)
- `9001` - WebSocket (conexión por navegador)

---

## 🎯 ¿Cómo Funciona?

```
[ESP32 - Botón Pánico] ──┐
                          ├─→ [Mosquitto - Broker MQTT] ──→ [MS1 - Recepción]
[ESP32 - GPS]            │
[Otros Dispositivos]────┘

Los dispositivos PUBLICAN mensajes
El Broker recibe y DISTRIBUYE esos mensajes
MS1 los SUSCRIBE (escucha) para procesarlos
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Con Docker (Recomendado)
```bash
docker-compose up mosquitto
```

El broker estará disponible en:
- **MQTT:** `mosquitto:1883`
- **WebSocket:** `ws://mosquitto:9001`

### Opción 2: Manual (en Linux/Mac)
```bash
# Instalar Mosquitto
brew install mosquitto          # Mac
sudo apt install mosquitto      # Linux

# Iniciar el broker
mosquitto -c mosquitto.conf

# En otra terminal, probar conexión
mosquitto_pub -h localhost -t "alertas/test" -m "Hola desde prueba"
```

---

## 📁 Estructura de Carpetas

```
mosquitto/
├── config/
│   └── mosquitto.conf      # Configuración del broker
├── data/                   # Base de datos persistente
└── log/                    # Archivos de logs
```

---

## ⚙️ Configuración (mosquitto.conf)

El archivo `mosquitto.conf` controla cómo funciona el broker:

```conf
# Puerto MQTT normal
listener 1883
protocol mqtt

# Puerto WebSocket (para navegador)
listener 9001
protocol websockets

# Permitir conexiones sin usuario/contraseña (solo desarrollo)
allow_anonymous true

# Persistencia de datos (guarda mensajes si se reinicia)
persistence true
persistence_location /mosquitto/data/

# Logs
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type all
```

**Importante:** En producción, habilita autenticación:
```conf
allow_anonymous false
password_file /mosquitto/config/passwd.txt
```

---

## 📨 Estructura de Mensajes

### Topic (Tema) de Publicación
Los ESP32 publican en:

```
alertas/{device_id}/{tipo}
```

**Ejemplos:**
```
alertas/esp32_001/panico
alertas/esp32_002/ubicacion
alertas/esp32_001/bateria
```

### Formato del Mensaje (JSON)

```json
{
  "device_id": "esp32_001",
  "latitude": 25.6867,
  "longitude": -100.3161,
  "alert_type": "PÁNICO",
  "timestamp": "2024-01-15T10:30:00Z",
  "battery": 85
}
```

---

## 🛠️ Herramientas para Probar

### Ver todos los mensajes en tiempo real

```bash
# Dentro del contenedor
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v

# Salida esperada
alertas/esp32_001/panico {"device_id":"esp32_001","latitude":25.6867,...}
alertas/esp32_002/ubicacion {"device_id":"esp32_002","latitude":25.7000,...}
```

### Publicar un mensaje de prueba

```bash
# Simular una alerta
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "alertas/esp32_001/panico" \
  -m '{"device_id":"esp32_001","latitude":25.6867,"longitude":-100.3161,"alert_type":"PÁNICO"}'
```

### Subscribirse a un topic específico

```bash
# Escuchar solo pánico
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "alertas/+/panico"

# Escuchar todo de esp32_001
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "alertas/esp32_001/#"
```

---

## 📊 Monitoreo

### Ver estadísticas del broker

```bash
# Conectarse a Mosquitto en modo interactivo
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/#'
```

**Métricas útiles que verás:**
```
$SYS/broker/clients/active
$SYS/broker/messages/received
$SYS/broker/messages/sent
$SYS/broker/load/messages/received/1min
```

### Ver logs en tiempo real

```bash
docker-compose logs -f mosquitto
```

**Logs importantes:**
```
New client connected from 172.20.0.1
Client esp32_001 received CONNECT
```

---

## 🔌 Conexión desde ESP32

Ejemplo de código para ESP32:

```cpp
#include <PubSubClient.h>
#include <WiFi.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  WiFi.begin("SSID", "password");
  
  // Conectar a Mosquitto
  client.setServer("mosquitto", 1883);
}

void loop() {
  if (!client.connected()) {
    client.connect("esp32_001");
  }
  
  // Publicar alerta de pánico
  String payload = "{\"device_id\":\"esp32_001\",\"latitude\":25.6867,\"longitude\":-100.3161}";
  client.publish("alertas/esp32_001/panico", payload.c_str());
  
  delay(5000);
}
```

---

## 🔐 Seguridad Básica

### En Producción, Configura Autenticación

1. **Crear archivo de contraseñas:**
```bash
docker-compose exec mosquitto mosquitto_passwd -c /mosquitto/config/passwd.txt admin
# Ingresa contraseña cuando se te pida
```

2. **Actualizar mosquitto.conf:**
```conf
allow_anonymous false
password_file /mosquitto/config/passwd.txt
```

3. **Reiniciar broker:**
```bash
docker-compose restart mosquitto
```

4. **Conectarse con usuario/contraseña:**
```bash
mosquitto_pub -h mosquitto -u admin -P micontraseña -t "alertas/test" -m "Mensaje"
```

---

## 🐛 Problemas Comunes

### El broker no inicia
```bash
# Ver el error
docker-compose logs mosquitto

# Verificar archivo de configuración
docker-compose exec mosquitto cat /mosquitto/config/mosquitto.conf
```

**Solución común:** Verifica permisos de carpetas
```bash
docker-compose exec mosquitto chmod 755 /mosquitto/data
```

### Los ESP32 no se conectan
```bash
# Verifica el listener está activo
docker-compose logs mosquitto | grep "listener"

# Asegúrate que puerto 1883 está expuesto en docker-compose.yml:
# ports:
#   - "1883:1883"
```

### No llegan mensajes a MS1
```bash
# Verifica que MS1 está suscrito
docker-compose logs ms1 | grep "subscribe"

# Verifica el topic es correcto
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v
```

### Alerta: "Cannot write to data directory"
```bash
docker-compose exec mosquitto chmod 777 /mosquitto/data
```

---

## 📈 Métricas y Performance

### Cantidad de clientes conectados

```bash
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/broker/clients/active'
```

**Esperado:** Mínimo 2 (MS1 debe estar conectado)

### Mensajes recibidos por minuto

```bash
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/broker/load/messages/received/1min'
```

### Monitorear en tiempo real con script

```bash
# Script para monitorear
while true; do
  echo "=== $(date) ==="
  docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/broker/clients/active' -u 1 2>/dev/null
  docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/broker/messages/received' -u 1 2>/dev/null
  sleep 5
done
```

---

## 🔄 Topics Recomendados

Estructura de topics para buena organización:

```
alertas/
├── esp32_001/
│   ├── panico          # Botón de pánico presionado
│   ├── ubicacion       # Actualización GPS
│   └── bateria         # Nivel de batería
├── esp32_002/
│   ├── panico
│   ├── ubicacion
│   └── bateria
└── estadisticas/       # Datos del sistema
    ├── conectados
    └── mensajes
```

---

## 🎯 Checklist de Configuración

- [ ] Mosquitto está corriendo: `docker-compose ps`
- [ ] Puerto 1883 es accesible: `telnet localhost 1883`
- [ ] MS1 está conectado: `docker-compose logs ms1`
- [ ] Se reciben mensajes: `mosquitto_sub -t "#"`
- [ ] Configuración correcta: revisar `mosquitto.conf`
- [ ] Persistencia habilitada: archivos en `/mosquitto/data`
- [ ] Logs disponibles: `docker-compose logs mosquitto`

---

## 📞 Debugging Avanzado

### Habilitar logs muy detallados

Edita `mosquitto.conf`:
```conf
log_type all
log_timestamp true
log_dest file /mosquitto/log/mosquitto.log
```

Luego:
```bash
docker-compose restart mosquitto
docker-compose logs -f mosquitto
```

### Monitorear tráfico de red

```bash
# Dentro del contenedor
docker-compose exec mosquitto sh
tcpdump -i eth0 -n port 1883
```

---

## 💾 Backup

### Respaldar configuración y datos

```bash
# Copiar config
docker cp c5-mosquitto:/mosquitto/config/mosquitto.conf ./backup/

# Copiar datos persistentes
docker cp c5-mosquitto:/mosquitto/data ./backup/mosquitto-data
```

---

## 🚀 Escalabilidad

Para sistemas con muchos dispositivos, considera:

1. **Aumentar conexiones permitidas** en `mosquitto.conf`:
```conf
max_connections -1  # Ilimitado
```

2. **Cluster de Mosquitto** (avanzado):
   - Instancia principal + réplicas
   - Bridge entre brokers
   - Load balancing con Nginx

3. **Aumentar limites de sistema:**
```bash
ulimit -n 65536  # Archivos abiertos
```

---

## 📚 Recursos

- **Mosquitto Docs:** https://mosquitto.org/man/
- **MQTT Protocol:** https://mqtt.org/
- **MQTT Explorer (herramienta GUI):** http://mqtt-explorer.com/

---

## 🎓 Próximos Pasos

1. **Probar con ESP32:** Carga el ejemplo en tus dispositivos
2. **Monitorear en tiempo real:** Usa `mosquitto_sub`
3. **Agregar seguridad:** Configura autenticación
4. **Documentar topics:** Mantén un registro de topics usados
5. **Alertar en anomalías:** Configura triggers en MS1

---

**¿Necesitas ayuda?** Revisa los logs:
```bash
docker-compose logs -f mosquitto
```
