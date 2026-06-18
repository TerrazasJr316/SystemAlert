# 🔧 Troubleshooting - Solución de Problemas

Guía para resolver los problemas más comunes en el Sistema C5.

---

## 🚨 Problemas Generales

### El sistema no inicia
```bash
# 1. Verifica estado de todos los servicios
docker-compose ps

# 2. Busca errores
docker-compose logs

# 3. Si hay puertos en uso:
# Encontrar qué ocupa el puerto
lsof -i :5000
lsof -i :1883
lsof -i :5173

# 4. Matar el proceso (usar con cuidado)
kill -9 [PID]

# 5. O cambiar puertos en docker-compose.yml

# 6. Reintentar
docker-compose down -v
docker-compose up -d
```

### El frontend muestra página en blanco
```bash
# 1. Abre consola del navegador (F12)
# 2. Busca errores rojos

# Posibles soluciones:
# - Verifica puerto 5173: docker-compose logs frontend
# - Verifica .env: VITE_API_URL debe ser correcto
# - Recarga la página: Ctrl+F5 (limpia caché)
# - Verifica que el backend está corriendo: curl http://localhost:5000

# 3. Si sigue igual, reinicia frontend
docker-compose restart frontend
```

### No se ve el mapa en el frontend
```bash
# 1. Verifica que Leaflet está cargado
# Abre consola (F12) y busca errores de Leaflet

# 2. Verifica conexión de internet (el mapa usa OpenStreetMap)

# 3. Intenta recargar:
# Ctrl+Shift+R (recarga hard)

# 4. Si sigue, revisa el código en MapPanel.jsx
```

---

## 📨 Problemas con MQTT (Broker)

### Mosquitto no inicia
```bash
# 1. Ver error específico
docker-compose logs mosquitto

# 2. Problemas comunes:

# ERROR: "Cannot write to data directory"
docker-compose exec mosquitto chmod 777 /mosquitto/data

# ERROR: "Config not found"
# Verifica que mosquitto.conf existe:
docker-compose exec mosquitto ls -la /mosquitto/config/

# ERROR: "Address already in use"
# Puerto 1883 ya está en uso. Ver qué lo usa:
lsof -i :1883

# 3. Reiniciar
docker-compose restart mosquitto
```

### No llegan mensajes a MQTT
```bash
# 1. Verificar que Mosquitto está escuchando
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v

# 2. En otra terminal, enviar prueba:
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "test/hola" \
  -m "Mensaje de prueba"

# 3. Si no aparece en la otra terminal, Mosquitto no funciona:
docker-compose logs mosquitto

# 4. Verificar configuración
docker-compose exec mosquitto cat /mosquitto/config/mosquitto.conf

# 5. Permitir conexiones sin autenticación (desarrollo):
# Editar mosquitto.conf y agregar:
# allow_anonymous true

docker-compose restart mosquitto
```

### ESP32 no se conecta a MQTT
```bash
# 1. Verificar que Mosquitto está accesible
# En el ESP32, revisar código:
# MQTT_HOST debe ser "mosquitto" (si está en Docker)
# O la IP del servidor si está remoto

# 2. Verificar puerto
# Debe ser 1883 (estándar MQTT)

# 3. Desde otro PC, intentar conexión:
mosquitto_pub -h [IP_DEL_SERVIDOR] -t "test" -m "Hola"

# 4. Si no conecta, verificar firewall
```

### Demasiados mensajes en MQTT
```bash
# Monitorear carga
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/broker/load/messages/received/1min'

# Si hay muchos, verificar:
# 1. Que los ESP32 no envían demasiado rápido
# 2. Aumentar capacidad: max_connections en mosquitto.conf
# 3. Agregar más instancias de MS1

# Limpiar mensajes antiguos (cuidado!)
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "alertas/+/historial" | head -1000
```

---

## ⚙️ Problemas con Backend (Microservicios)

### MS1 (Recepción) no inicia
```bash
# 1. Ver error
docker-compose logs ms1

# Errores comunes:

# "MQTT connection refused"
# Mosquitto no está corriendo
docker-compose up -d mosquitto

# "Cannot find module"
# Faltan dependencias
docker-compose exec ms1 npm install

# "Port already in use"
# Cambiar puerto en docker-compose.yml

# 2. Reintentar
docker-compose restart ms1
```

### MS2 (Geolocalización) falla
```bash
# 1. Ver error
docker-compose logs ms2

# Errores comunes:

# "ModuleNotFoundError"
docker-compose exec ms2 pip install -r requirements.txt

# "Connection refused"
# MS1 no está conectando. Ver:
docker-compose logs ms1

# 2. Probar manualmente
docker-compose exec ms2 python main.py
```

### MS3 (Prioridad) no guarda en BD
```bash
# 1. Ver error
docker-compose logs ms3

# 2. Verificar conexión a PostgreSQL
docker-compose exec ms3 ping postgres-master

# 3. Verificar credenciales en .env de ms3
docker-compose exec ms3 cat .env | grep POSTGRES

# 4. Intentar conectar directamente:
docker-compose exec postgres-master psql -U admin -d alertas_c5

# 5. Si no conecta, revisar logs de postgres
docker-compose logs postgres-master
```

### Alertas no aparecen en tiempo real (MS4)
```bash
# 1. Verificar que MS4 está corriendo
docker-compose logs ms4

# 2. Verificar WebSocket está activo
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:5004

# 3. Verificar Redis
docker-compose exec redis redis-cli PING

# 4. Reiniciar MS4
docker-compose restart ms4

# 5. En frontend, abrir consola (F12) y buscar "Socket.io"
```

### MS5 (Historial) no devuelve datos
```bash
# 1. Ver error
docker-compose logs ms5

# 2. Probar endpoint
curl http://localhost:5000/alertas

# 3. Si devuelve error 500, revisar:
# - Conexión a PostgreSQL
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "SELECT COUNT(*) FROM alertas;"

# 4. Si devuelve 0, no hay datos
# - Envía una alerta de prueba
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "alertas/esp32_001/panico" \
  -m '{"device_id":"esp32_001","latitude":25.6867,"longitude":-100.3161}'

# 5. Espera 5 segundos y vuelve a intentar
curl http://localhost:5000/alertas
```

---

## 💾 Problemas con Base de Datos

### No puedo conectar a PostgreSQL
```bash
# 1. Verificar que está corriendo
docker-compose ps | grep postgres

# 2. Intentar conexión
docker-compose exec postgres-master psql -U admin -d alertas_c5

# 3. Si dice "authentication failed"
# Verifica contraseña en docker-compose.yml

# 4. Si dice "database does not exist"
# Crear BD:
docker-compose exec postgres-master createdb -U admin alertas_c5

# 5. Ver logs
docker-compose logs postgres-master
```

### Tabla "alertas" no existe
```bash
# 1. Conectar a BD
docker-compose exec postgres-master psql -U admin -d alertas_c5

# 2. Ver tablas
\dt

# 3. Si no está, crear:
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

# 4. Salir
\q
```

### La réplica de PostgreSQL no sincroniza
```bash
# 1. Verificar master
docker-compose logs postgres-master | grep replication

# 2. Verificar replica
docker-compose logs postgres-replica

# 3. Ejecutar manualmente:
docker-compose exec postgres-replica /replica-entrypoint.sh

# 4. Reintentar
docker-compose restart postgres-replica
```

### Base de datos muy pesada
```bash
# 1. Ver tamaño
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "SELECT pg_size_pretty(pg_database_size('alertas_c5'));"

# 2. Hacer vacuum
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "VACUUM ANALYZE;"

# 3. Ver alertas totales
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "SELECT COUNT(*) FROM alertas;"

# 4. Archivar alertas antiguas (opcional)
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "DELETE FROM alertas WHERE created_at < NOW() - INTERVAL '90 days';"
```

---

## 💾 Problemas con Redis

### Redis no responde
```bash
# 1. Verificar que está corriendo
docker-compose ps | grep redis

# 2. Conectar
docker-compose exec redis redis-cli

# 3. Test
PING  # Debe responder PONG

# 4. Si no responde, reiniciar
docker-compose restart redis
```

### Redis está lleno
```bash
# 1. Ver información
docker-compose exec redis redis-cli INFO

# 2. Ver tamaño
docker-compose exec redis redis-cli INFO stats | grep used_memory

# 3. Limpiar datos viejos
docker-compose exec redis redis-cli FLUSHALL  # ¡Cuidado! Elimina todo

# 4. O limpiar stream específico
docker-compose exec redis redis-cli DEL alertas
```

### Alertas no se guardan en Redis
```bash
# 1. Verificar que MS3 está guardando
docker-compose logs ms3 | grep redis

# 2. Verificar conexión
docker-compose exec redis redis-cli PING

# 3. Ver stream
docker-compose exec redis redis-cli XREAD COUNT 10 STREAMS alertas 0

# 4. Si está vacío, MS3 no está publicando
docker-compose logs ms3
```

---

## 🖥️ Problemas de Performance

### Sistema muy lento
```bash
# 1. Ver uso de recursos
docker stats

# 2. Si CPU es alta:
# - Aumentar réplicas de MS1
# - Verificar logs por loops infinitos

# 3. Si memoria es alta:
# - Reiniciar servicios: docker-compose restart
# - Limpiar Docker: docker system prune

# 4. Si disco es alto:
# - Ver logs: du -sh logs/
# - Hacer backup y limpiar datos viejos

# 5. Monitorear en tiempo real
watch -n 1 'docker stats --no-stream'
```

### Frontend lento / no responde
```bash
# 1. Abrir DevTools (F12)
# 2. Ver Network tab
# 3. Buscar requests que tarden mucho

# 4. Verificar backend
curl http://localhost:5000/alertas

# 5. Si es lento, revisar BD
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "SELECT COUNT(*) FROM alertas;"

# 6. Si hay muchos registros, agregar índices
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "CREATE INDEX idx_created_at ON alertas(created_at);"
```

---

## 🔐 Problemas de Seguridad

### Acceso no autorizado al dashboard
```bash
# 1. Cambiar puerto de acceso
# En docker-compose.yml:
# ports:
#   - "8080:5173"  # En lugar de 5173

# 2. Agregar contraseña en Nginx
# Editar nginx/nginx.conf y agregar:
# auth_basic "Administrador";
# auth_basic_user_file /etc/nginx/.htpasswd;

# 3. Usar HTTPS
# Generar certificados SSL
# Configurar en Nginx
```

### Mensajes MQTT sin cifrar
```bash
# En producción, habilitar TLS:

# 1. Generar certificados
openssl req -x509 -days 365 -out mosquitto.crt -keyout mosquitto.key -newkey rsa:2048 -nodes

# 2. Copiar a mosquitto/config/

# 3. Editar mosquitto.conf
listener 8883
tls_version tlsv1.2
cafile /mosquitto/config/ca.crt
certfile /mosquitto/config/mosquitto.crt
keyfile /mosquitto/config/mosquitto.key

# 4. Reiniciar
docker-compose restart mosquitto
```

---

## 🆘 Último Recurso - Reset Completo

Si nada funciona, resetea todo:

```bash
# ADVERTENCIA: Esto borra todos los datos

# 1. Parar todo
docker-compose down -v

# 2. Limpiar volúmenes
docker volume prune

# 3. Limpiar imágenes (opcional)
docker image prune

# 4. Iniciar de cero
docker-compose up --build -d

# 5. Esperar 30 segundos
sleep 30

# 6. Verificar
docker-compose ps
```

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] `docker-compose ps` muestra todos los servicios UP
- [ ] `curl http://localhost:5000` responde
- [ ] Frontend carga sin errores: `http://localhost:5173`
- [ ] Mosquitto recibe mensajes: `mosquitto_sub`
- [ ] PostgreSQL conecta: `psql`
- [ ] Redis responde: `redis-cli ping`
- [ ] Logs no muestran errores: `docker-compose logs`

---

## 📞 Información Útil para Reportar

Si necesitas pedir ayuda, incluye:

```bash
# Generar reporte
docker-compose ps > status.txt
docker-compose logs > logs.txt
docker stats --no-stream > stats.txt

# Información del sistema
uname -a >> diagnostico.txt
docker --version >> diagnostico.txt
```

---

## 🎯 Recursos de Debugging

```bash
# Monitorear en tiempo real
watch -n 1 'docker-compose ps'

# Ver todo en una línea
docker-compose logs --tail 100 -f

# Buscar errores específicos
docker-compose logs | grep -i error

# Exportar logs a archivo
docker-compose logs > c5_diagnostico_$(date +%Y%m%d_%H%M%S).log
```

---

**¿El problema persiste? Revisa:**
1. Los logs específicos del servicio
2. Este documento de troubleshooting
3. La documentación de cada componente (frontend, backend, broker)
4. El archivo QUICK_REFERENCE.md

**¡Éxito!** 🚀
