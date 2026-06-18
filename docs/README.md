# 📚 Documentación del Sistema C5

Bienvenido a la documentación del **Sistema de Alerta Ciudadana C5**. 

Esta carpeta contiene guías prácticas y simples para trabajar con cada componente del sistema.

## 🎯 ¿Qué es el Sistema C5?

Un sistema que recibe alertas desde dispositivos móviles (ESP32 con GPS), las procesa y las muestra en tiempo real en un mapa interactivo para operadores.

---

## 📑 Documentación por Componente

### 🖥️ **[FRONTEND](./frontend/README.md)**
- Dashboard interactivo con mapa en tiempo real
- Gestión de alertas y historial
- Cómo ejecutar, cambios comunes y troubleshooting

### ⚙️ **[BACKEND](./backend/README.md)**
- Microservicios que procesan las alertas
- Cómo ejecutar, configuración básica y comandos útiles
- Gestión de datos y base de datos

### 📨 **[BROKER MQTT](./broker/README.md)**
- Cómo se reciben las alertas desde los dispositivos
- Configuración, puertos y monitoreo
- Debugging y problemas comunes

---

## 🚀 Inicio Rápido

```bash
# Clonar el proyecto
git clone <repositorio>
cd SystemAlert

# Ejecutar todo con Docker (recomendado)
docker-compose up -d

# Abrir el dashboard
http://localhost:8080  # Frontend
http://localhost:5000  # API REST
```

---

## 📊 Flujo General

```
[ESP32 con GPS] 
    ↓ (envia alertas por MQTT)
[Mosquitto - Broker MQTT]
    ↓ (recibe alertas)
[MS1 - Recepción] → [MS2 - Geolocalización] → [MS3 - Prioridad]
    ↓ (procesa y guarda)
[PostgreSQL] + [Redis]
    ↓ (en tiempo real)
[MS4 - Notificaciones] + [MS5 - Historial]
    ↓ (websocket/rest)
[Frontend Dashboard] 👨‍💼 Operador
```

---

## 📞 Necesitas Ayuda?

- Verifica primero la documentación de cada componente
- Revisa los logs: `docker-compose logs -f [servicio]`
- Comprueba las variables de entorno en los archivos `.env`

---

## 📝 Notas

- Toda la documentación está escrita de forma simple y práctica
- Se evitan tecnicismos innecesarios
- Incluye comandos listos para usar
- Sección de problemas comunes en cada componente

**¡Feliz desarrollo!** 🎉
