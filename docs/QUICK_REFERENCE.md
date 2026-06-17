# 🚀 Quick Reference - Comandos Útiles

Guía rápida de comandos para trabajar con el sistema C5.

---

## 🐳 Docker Compose

```bash
# Iniciar TODO
docker-compose up -d

# Parar TODO
docker-compose down

# Ver estado de servicios
docker-compose ps

# Ver logs de un servicio
docker-compose logs -f [servicio]

# Ejemplos de logs
docker-compose logs -f ms1          # Logs de recepción
docker-compose logs -f mosquitto    # Logs del broker
docker-compose logs -f frontend     # Logs del dashboard

# Reiniciar un servicio
docker-compose restart ms3

# Construir imágenes
docker-compose build

# Ejecutar comando en contenedor
docker-compose exec [servicio] [comando]

# Ejemplo: conectar a PostgreSQL
docker-compose exec postgres-master psql -U admin -d alertas_c5
```

---

## 📊 Base de Datos (PostgreSQL)

### Conectarse a la BD
```bash
docker-compose exec postgres-master psql -U admin -d alertas_c5
```

### Comandos SQL Útiles

```sql
-- Ver todas las alertas
SELECT * FROM alertas ORDER BY created_at DESC LIMIT 10;

-- Alertas de hoy
SELECT * FROM alertas WHERE DATE(created_at) = CURRENT_DATE;

-- Alertas críticas
SELECT * FROM alertas WHERE priority = 'CRÍTICA' ORDER BY created_at DESC;

-- Contar alertas por zona
SELECT zona, COUNT(*) as cantidad FROM alertas GROUP BY zona ORDER BY cantidad DESC;

-- Contar alertas por tipo
SELECT alert_type, COUNT(*) as cantidad FROM alertas GROUP BY alert_type;

-- Últimas 5 alertas de esp32_001
SELECT * FROM alertas WHERE device_id = 'esp32_001' ORDER BY created_at DESC LIMIT 5;

-- Alertas de los últimos 30 minutos
SELECT * FROM alertas WHERE created_at > NOW() - INTERVAL '30 minutes';

-- Contar alertas por estado
SELECT status, COUNT(*) FROM alertas GROUP BY status;

-- Ver tabla completa
\dt

-- Salir de psql
\q
```

---

## 📨 MQTT - Mosquitto

### Escuchar todos los mensajes
```bash
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v
```

### Escuchar un topic específico
```bash
# Solo pánico
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "alertas/+/panico"

# Solo de un dispositivo
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "alertas/esp32_001/#"
```

### Enviar mensaje de prueba
```bash
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "alertas/esp32_001/panico" \
  -m '{"device_id":"esp32_001","latitude":25.6867,"longitude":-100.3161,"alert_type":"PÁNICO"}'
```

### Monitorear estadísticas
```bash
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t '$SYS/#'
```

---

## ⚙️ Backend - Microservicios

### Ver logs en tiempo real
```bash
docker-compose logs -f ms1    # Recepción
docker-compose logs -f ms2    # Geolocalización  
docker-compose logs -f ms3    # Prioridad
docker-compose logs -f ms4    # Notificaciones
docker-compose logs -f ms5    # Historial
```

### Probar API REST (MS5 - Historial)
```bash
# Todas las alertas
curl http://localhost:5000/alertas

# Por fecha
curl http://localhost:5000/alertas?fecha=2024-01-15

# Por zona
curl http://localhost:5000/alertas?zona=Centro

# Por tipo
curl http://localhost:5000/alertas?tipo=PÁNICO

# Detalle específico
curl http://localhost:5000/alertas/1

# Con Pretty Print
curl http://localhost:5000/alertas | jq '.'
```

### Verificar salud de servicios
```bash
curl http://localhost:5001/health   # MS1
curl http://localhost:5002/health   # MS2
curl http://localhost:5003/health   # MS3
curl http://localhost:5004/health   # MS4
curl http://localhost:5000/health   # MS5
```

---

## 💾 Redis

### Conectarse a Redis
```bash
docker-compose exec redis redis-cli
```

### Comandos útiles en Redis
```bash
# Ver todas las claves
KEYS *

# Ver detalles
INFO

# Ver alertas en stream
XREAD COUNT 10 STREAMS alertas 0

# Obtener una clave específica
GET alerta:1

# Monitorear en tiempo real
MONITOR

# Salir
EXIT
```

---

## 🖥️ Frontend

### Iniciar en desarrollo
```bash
cd frontend
npm install
npm run dev
```

### Compilar para producción
```bash
npm run build
npm run preview
```

### Abrir en navegador
```
http://localhost:5173
```

### Ver consola del navegador (F12)
- Click derecho → Inspeccionar
- Tab → Consola
- Busca errores y logs

---

## 🔍 Debugging

### Ver si un puerto está en uso
```bash
lsof -i :5000          # Verificar puerto 5000
lsof -i :1883          # Verificar puerto 1883
lsof -i :5173          # Verificar puerto 5173
```

### Limpiar todo y empezar de cero
```bash
# Parar todos
docker-compose down

# Eliminar volúmenes (borra datos!)
docker-compose down -v

# Reconstruir
docker-compose build --no-cache

# Iniciar
docker-compose up -d
```

### Ver evento de alerta en tiempo real
```bash
# Terminal 1: escuchar MQTT
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "#" -v

# Terminal 2: enviar alerta
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "alertas/esp32_001/panico" \
  -m '{"device_id":"esp32_001","latitude":25.6867,"longitude":-100.3161,"alert_type":"PÁNICO"}'

# Terminal 3: ver en BD
docker-compose exec postgres-master psql -U admin -d alertas_c5
SELECT * FROM alertas ORDER BY created_at DESC LIMIT 1;

# Terminal 4: ver en frontend
# Abre http://localhost:5173 en navegador
```

---

## 📦 Hacer Backup

### Backup completo de BD
```bash
docker-compose exec postgres-master pg_dump -U admin -d alertas_c5 > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar desde backup
```bash
docker-compose exec -T postgres-master psql -U admin -d alertas_c5 < backup.sql
```

### Respaldar archivos importantes
```bash
# Copia los archivos
cp -r mosquitto/data ./backup_mosquitto_data
cp -r services ./backup_services
cp docker-compose.yml ./backup_docker-compose.yml
```

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Frontend no carga | `docker-compose logs -f frontend` y verifica puerto 5173 |
| No llegan alertas | `docker-compose logs -f ms1` y verifica MQTT en `mosquitto_sub` |
| BD está lenta | Reinicia: `docker-compose restart postgres-master` |
| Redis no responde | Verifica: `docker-compose exec redis redis-cli ping` |
| Mosquitto no inicia | Permisos: `docker-compose exec mosquitto chmod 755 /mosquitto/data` |

---

## 🔐 Producción - Checklist

```bash
# Cambiar contraseña de BD
# Editar docker-compose.yml:
# POSTGRES_PASSWORD=senha_fuerte_aqui

# Habilitar autenticación MQTT
docker-compose exec mosquitto mosquitto_passwd -c /mosquitto/config/passwd.txt admin

# Cambiar variable VITE_API_URL en frontend/.env
VITE_API_URL=https://api.production.com

# Usar HTTPS en lugar de HTTP
# Configurar certificados SSL

# Aumentar réplicas de MS1
# Editar docker-compose.yml:
# deploy:
#   replicas: 5

# Hacer backup antes de deploy
docker-compose exec postgres-master pg_dump -U admin -d alertas_c5 > pre_deploy_backup.sql
```

---

## 📊 Monitorear Rendimiento

```bash
# CPU y Memoria
docker stats

# Red
docker network inspect c5-network

# Espacio en disco
du -sh mosquitto/data
du -sh services

# Procesos
docker ps --no-trunc
```

---

## 🎯 Flujo Completo de Prueba

```bash
# 1. Iniciar todo
docker-compose up -d

# 2. Esperar 10 segundos a que levante todo
sleep 10

# 3. Verificar status
docker-compose ps

# 4. Enviar alerta de prueba
docker-compose exec mosquitto mosquitto_pub \
  -h mosquitto \
  -t "alertas/esp32_001/panico" \
  -m '{"device_id":"esp32_001","latitude":25.6867,"longitude":-100.3161,"alert_type":"PÁNICO"}'

# 5. Ver en BD
docker-compose exec postgres-master psql -U admin -d alertas_c5 -c "SELECT * FROM alertas ORDER BY created_at DESC LIMIT 1;"

# 6. Abrir en navegador
# http://localhost:5173

# 7. Verificar en frontend que aparece en el mapa

# ¡Éxito! ✅
```

---

## 💡 Tips Útiles

- Usar `jq` para formatear JSON: `curl ... | jq '.'`
- Guardar comandos frecuentes en alias bash
- Usar `watch` para monitorear cambios: `watch -n 1 'docker-compose ps'`
- Documentar cambios en git después de cada configuración
- Hacer backup antes de hacer cambios importantes

---

## 📚 Recursos

- Docker: https://docs.docker.com/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/docs/
- MQTT: https://mosquitto.org/man/
- React: https://react.dev/

---

**Guardá este archivo para consulta rápida!** 💾
