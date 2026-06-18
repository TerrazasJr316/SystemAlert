# 🚨 Sistema de Alerta Ciudadana C5

Sistema distribuido que recibe alertas de dispositivos IoT (ESP32 con GPS), las procesa en tiempo real y las muestra en un dashboard interactivo para operadores.

---

## 🎯 ¿Cuál es el Problema?

Necesitábamos una forma de:
- ✅ Recibir alertas desde múltiples dispositivos IoT remotos
- ✅ Procesarlas y priorizarlas automáticamente
- ✅ Mostrarlas en tiempo real en un mapa
- ✅ Guardar historial para consultas posteriores
- ✅ Escalar a cientos de dispositivos simultáneamente

**Solución:** Sistema distribuido con microservicios, MQTT, y WebSocket en tiempo real.

---

## 🛠️ Diagrama de Arquitectura

![diagrama](src/Diagrama%20de%20arquitectura.png)

## 📁 Estructura del Proyecto

```
SystemAlert/
├── docs/                          # DOCUMENTACIÓN COMPLETA (¡EMPEZAR AQUÍ!)
│   ├── README.md                  # Guía general
│   ├── QUICK_REFERENCE.md         # Comandos útiles
│   ├── TROUBLESHOOTING.md         # Solución de problemas
│   ├── frontend/                  # Doc del Dashboard
│   ├── backend/                   # Doc de Microservicios
│   └── broker/                    # Doc de MQTT
│
├── esp32/                         # Código para dispositivos IoT
│   ├── esp32_001/
│   └── esp32_002/
│
├── frontend/                      # DASHBOARD (React)
│   ├── src/
│   │   ├── components/            # Mapa, Feed, Historial, etc.
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── services/                      # MICROSERVICIOS
│   ├── ms1/                       # Recepción (Node.js)
│   ├── ms2/                       # Geolocalización (Python)
│   ├── ms3/                       # Prioridad (Node.js)
│   ├── ms4/                       # Notificaciones (Node.js)
│   └── ms5/                       # Historial/API (Node.js)
│
├── mosquitto/                     # BROKER MQTT
│   └── config/
│       └── mosquitto.conf
│
├── postgres/                      # BASE DE DATOS
│   ├── master/
│   └── replica/
│
├── nginx/                         # LOAD BALANCER
│   └── nginx.conf
│
├── docker-compose.yml             # ORQUESTACIÓN
├── README.md                      # Este archivo
└── CONTRIBUTING.md                # Guía de contribución
```
---

## 🚀 Inicio Rápido - Docker

```bash
# 1. Clonar
git clone https://github.com/TerrazasJr316/SystemAlert.git
cd SystemAlert

# 2. Ejecutar TODO (MongoDB, Servicios, Frontend)
docker-compose up -d

# 3. Abrir dashboard
http://localhost:5173

# Ver logs
docker-compose logs -f

# Parar todo
docker-compose down
```

### ✅ Servicios Disponibles

| Servicio | URL | Puerto |
|----------|-----|--------|
| **Dashboard** | http://localhost:5173 | 5173 |
| **API (MS5)** | http://localhost:5000 | 8080 |
| **WebSocket (MS4)** | ws://localhost:5004 | 5004 |
| **MQTT** | mosquitto:1883 | 1883 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |

---

## 📚 Documentación Detallada

Luego accede a:
- 🖥️ **[Frontend](./docs/frontend/README.md)** - Dashboard
- ⚙️ **[Backend](./docs/backend/README.md)** - Microservicios
- 📨 **[MQTT](./docs/broker/README.md)** - Broker y IoT
- 🚀 **[Comandos Rápidos](./docs/QUICK_REFERENCE.md)** - Copy-paste listos
- 🔧 **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Solución de problemas
