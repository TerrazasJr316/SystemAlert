# Guía de Contribución - Sistema de Alerta Ciudadana C5

¡Gracias por tu interés en contribuir al Sistema de Alerta Ciudadana C5! Esta guía te ayudará a configurar tu ambiente de desarrollo y entender cómo contribuir tanto en el backend como en el frontend.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Filosofía de Ramas & Ambiente Git](#filosofía-de-ramas--ambiente-git)
3. [Configuración del Ambiente](#configuración-del-ambiente)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Desarrollo Backend](#desarrollo-backend)
6. [Desarrollo Frontend](#desarrollo-frontend)
7. [Guía de Commits](#guía-de-commits)
8. [Testing](#testing)
9. [Buenas Prácticas](#buenas-prácticas)

---

## 📦 Requisitos Previos

### Software Obligatorio
- **Git** >= 2.30
- **Node.js** >= 16.x (para MS1, MS4, MS5 y Frontend)
- **Python** >= 3.8 (para MS2, MS3)
- **PostgreSQL** >= 12 (base de datos principal)
- **Redis** >= 6.0 (caché y streams)
- **Mosquitto** >= 2.0 (MQTT broker)

### Software Opcional
- **Docker** y **Docker Compose** (para facilitar el setup)
- **Postman** o **Insomnia** (para testing de APIs)
- **DBeaver** o **pgAdmin** (para visualizar PostgreSQL)
- **VS Code** (editor recomendado)

### Extensiones VS Code Recomendadas
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "eamodio.gitlens"
  ]
}
```

---

## 🌳 Filosofía de Ramas & Ambiente Git

### Estrategia de Branching: Git Flow Simplificado

Usamos una versión simplificada de **Git Flow** adaptada para nuestro equipo de desarrollo:

```
main (Producción) ← Merges desde release branches
    ↓
develop (Integración Continua) ← Merges desde feature branches
    ↑
feature/* (Desarrollo de Features)
bugfix/* (Correcciones de Bugs)
hotfix/* (Parches de Emergencia)
```

### Estructura de Ramas

#### 1. **main** - Rama de Producción
```
⚠️  Rama protegida - No se hace push directo
- Contiene código listo para producción
- Solo se recibe merges de release/* o hotfix/*
- Requiere code review y tests pasados
- Cada merge es una release lista
```

**Acciones en main:**
```bash
# Solo pull requests autorizadas
git checkout main
git pull origin main
```

#### 2. **develop** - Rama de Desarrollo
```
🚀 Rama base para desarrollo
- Integración continua de features
- Debe estar siempre funcional
- Recibe merges de feature/* y bugfix/*
- Requiere PR con code review
```

**Comenzar trabajo desde develop:**
```bash
git checkout develop
git pull origin develop
```

#### 3. **feature/\*** - Nuevas Características
```
Nomenclatura: feature/<nombre-corto>

Ejemplos:
- feature/add-email-notifications
- feature/improve-map-performance
- feature/geolocation-service
```

**Crear feature branch:**
```bash
# Desde develop, crear feature local
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo

# Trabajar en la rama y hacer commits
git add .
git commit -m "feat: descripción del cambio"
git push -u origin feature/nombre-descriptivo

# Cuando termines, abrir Pull Request en GitHub
```

**Completar feature:**
```bash
# 1. Asegurar que está actualizado con develop
git fetch origin
git rebase origin/develop

# 2. Push con cambios rebasados
git push --force-with-lease origin feature/nombre-descriptivo

# 3. Abrir PR en GitHub (automático si usas GitHub CLI)
gh pr create --base develop --fill
```

#### 4. **bugfix/\*** - Correcciones de Bugs
```
Nomenclatura: bugfix/<nombre-corto>

Ejemplos:
- bugfix/fix-duplicate-alerts
- bugfix/memory-leak-ms2
- bugfix/socket-connection-timeout
```

**Crear bugfix branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/descripción-del-bug

# Realizar correcciones
git add .
git commit -m "fix(ms1): descripción concisa del fix"
git push -u origin bugfix/descripción-del-bug

# Abrir PR
```

#### 5. **hotfix/\*** - Parches de Emergencia
```
Nomenclatura: hotfix/<nombre-corto>
Rama base: main (no develop)

Ejemplos:
- hotfix/critical-security-patch
- hotfix/database-connection-crash
```

**Crear hotfix branch:**
```bash
# Basado directamente en main (no en develop)
git checkout main
git pull origin main
git checkout -b hotfix/descripción-crítica

# Aplicar fix urgente
git add .
git commit -m "fix: descripción del hotfix"

# Push y crear PR hacia main
git push -u origin hotfix/descripción-crítica

# ⚠️  IMPORTANTE: Después de mergear a main, 
# mergear también a develop para sincronizar
```

### Nomenclatura de Ramas

**Reglas:**
- Usar lowercase
- Separar palabras con guiones (-)
- Ser descriptivo pero conciso
- Máximo 50 caracteres
- Incluir contexto del servicio si aplica

**✅ Bueno:**
```
feature/ms1-mqtt-validation
bugfix/fix-redis-connection-pool
hotfix/security-sql-injection
feature/frontend-leaflet-zoom
```

**❌ Malo:**
```
feature/mejoras
bugfix/bug123
fix-everything-please
feature/adds-stuff-and-more-stuff-and-even-more
```

---

## 🔧 Ambiente de Trabajo con Git

### Configuración Inicial Recomendada

```bash
# Configurar usuario global (si no lo has hecho)
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"

# Configurar para este repositorio (recomendado)
cd SystemAlert
git config user.name "Tu Nombre"
git config user.email "tu.email@ejemplo.com"

# Ver configuración
git config --list
```

### Setup Local Óptimo

```bash
# 1. Clonar el repositorio
git clone https://github.com/TerrazasJr316/SystemAlert.git
cd SystemAlert

# 2. Configurar upstream (importante para mantener sincronizado)
git remote -v  # Ver remotes actuales
git remote add upstream https://github.com/TerrazasJr316/SystemAlert.git

# 3. Configurar rama por defecto
git config branch.autosetuprebase always  # Rebase por defecto
git config pull.rebase true              # Pull siempre hace rebase

# 4. Crear alias útiles
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --graph --oneline --all'
```

### Workflow Diario Recomendado

```bash
# 1️⃣  Comenzar el día - Sincronizar con desarrollo
git checkout develop
git pull origin develop

# 2️⃣  Crear rama de trabajo (si no existe)
git checkout -b feature/mi-nueva-feature

# 3️⃣  Trabajar y hacer commits frecuentes
git add src/componente.js
git commit -m "feat(ms1): add new validation"

# 4️⃣  Cada vez que termines un cambio significativo
git push origin feature/mi-nueva-feature

# 5️⃣  Antes de hacer PR - Actualizar con develop
git fetch origin
git rebase origin/develop

# 6️⃣  Si hay conflictos
git status  # Ver conflictos
# Resolver conflictos manualmente en editor
git add .
git rebase --continue
# O abortar si algo falla
# git rebase --abort

# 7️⃣  Push forzado (después de rebase)
git push --force-with-lease origin feature/mi-nueva-feature

# 8️⃣  Crear Pull Request
# En GitHub, o vía CLI:
gh pr create --base develop --title "feat: descripción" --body "Detalles"
```

### Comandos Git Diarios Útiles

```bash
# Ver estado actual
git status
git log --oneline -10

# Ver ramas locales y remotas
git branch -a
git branch -vv  # Mostrar tracking branches

# Mantener rama sincronizada
git fetch origin
git rebase origin/develop  # O merge si prefieres
git push --force-with-lease

# Crear rama desde issue (con GitHub CLI)
gh issue list
gh issue develop <issue-number>

# Limpiar branches locales eliminadas remotamente
git fetch --prune
git branch -vv | grep 'gone' | awk '{print $1}' | xargs git branch -d

# Ver cambios antes de commit
git diff                    # Cambios unstaged
git diff --staged          # Cambios staged
git diff HEAD~1           # Cambios del último commit

# Revertir cambios
git restore <archivo>      # Descartar cambios en archivo
git restore --staged <archivo>  # Unstage
git reset --soft HEAD~1   # Deshacer último commit (guardar cambios)
git reset --hard HEAD~1   # Deshacer último commit (perder cambios)
```

### Stashing - Guardar Trabajo Temporal

```bash
# Cuando necesitas cambiar de rama sin hacer commit
git stash save "WIP: descripción del trabajo"

# Ver stashes guardados
git stash list

# Recuperar stash (reaplica y mantiene)
git stash apply stash@{0}

# Recuperar y eliminar
git stash pop stash@{0}

# Descartar stash
git stash drop stash@{0}
```

### .gitignore Recomendado

Asegurar que el proyecto tenga un `.gitignore` completo:

```
# Node.js
node_modules/
npm-debug.log
.npm

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.egg-info/

# Testing
coverage/
.nyc_output/

# Logs
logs/
*.log
```

### Pre-commit Hooks (Opcional pero Recomendado)

Para evitar commits sin pasar linter:

```bash
# Instalar husky
npm install husky --save-dev
npx husky install

# Agregar pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
npm run lint
npm test
EOF

chmod +x .husky/pre-commit
```

### Sincronización Entre Ramas

```bash
# Actualizar develop desde main (después de merge de hotfix)
git checkout develop
git pull origin main

# Actualizar feature con cambios recientes de develop
git fetch origin
git rebase origin/develop

# Mergear develop en feature (alternativa a rebase)
git merge origin/develop
```

### Resolver Conflictos

```bash
# 1. Ver conflictos
git status

# 2. Abrir archivo con conflicto y resolver manualmente
#    Buscar: <<<<<<<, =======, >>>>>>>

# 3. Después de resolver
git add <archivo-resuelto>
git rebase --continue  # O git merge --continue

# 4. Si todo se complica
git rebase --abort  # Cancelar rebase
git merge --abort   # Cancelar merge
```

### Mejores Prácticas de Git

#### ✅ Hacer
```bash
# Commits atómicos (un cambio por commit)
git add src/validation.js
git commit -m "feat(ms1): add email validation"

git add tests/validation.test.js
git commit -m "test(ms1): add validation tests"

# Pull antes de Push
git pull --rebase origin develop
git push origin feature/mi-rama

# Hacer commit regularmente (no gigantes)
# Commits pequeños = fácil de revisar = menos merge conflicts

# Mantener ramas actualizadas
git fetch origin
git rebase origin/develop
```

#### ❌ Evitar
```bash
# NO commitear todo de una vez
git add .
git commit -m "changes"

# NO hacer push directo a develop o main
git push -f origin develop  # ¡NUNCA!

# NO commits con mensajes genéricos
git commit -m "fix stuff"
git commit -m "update"

# NO trabajar semanas sin sincronizar con develop
# Resultado: conflictos enormes

# NO rebase forzado en ramas compartidas
# Usar: git push --force-with-lease (más seguro)
```

---



### 1. Clonar el Repositorio
```bash
git clone https://github.com/TerrazasJr316/SystemAlert.git
cd SystemAlert
```

### 2. Instalación Rápida con Docker Compose

Si tienes Docker instalado, es la forma más fácil:

```bash
# En la raíz del proyecto
docker-compose up -d

# Verifica que todos los servicios estén corriendo
docker-compose ps
```

**Servicios que se levantan:**
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- Mosquitto MQTT (puerto 1883)
- MS1 - Recepción (puerto 3001)
- MS2 - Geolocalización (puerto 5001)
- MS3 - Prioridad (puerto 5002)
- MS4 - Notificaciones (puerto 4001)
- MS5 - Historial (puerto 4000)
- Frontend React (puerto 3000)

### 3. Instalación Manual

#### 3.1 PostgreSQL
```bash
# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Crear usuario y BD
sudo -u postgres createuser systemalert -P
sudo -u postgres createdb -O systemalert systemalert_db

# Inicializar tablas (ver scripts en services/db/migrations)
psql -U systemalert -d systemalert_db < services/db/init.sql
```

#### 3.2 Redis
```bash
# Linux
sudo apt-get install redis-server
redis-server
```

#### 3.3 Mosquitto MQTT
```bash
# Linux
sudo apt-get install mosquitto

# Iniciar servicio
sudo systemctl start mosquitto
```

#### 3.4 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=systemalert
DB_PASSWORD=your_password
DB_NAME=systemalert_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=

# Node Ports
MS1_PORT=3001
MS4_PORT=4001
MS5_PORT=4000

# Python Ports
MS2_PORT=5001
MS3_PORT=5002

# Frontend
REACT_APP_API_MS5=http://localhost:4000
REACT_APP_WS_MS4=ws://localhost:4001
```

Copiar este archivo a cada microservicio con las variables necesarias:
- `services/ms1-recepcion/.env`
- `services/ms2-geolocalización/.env`
- `services/ms3-prioridad/.env`
- `services/ms4-notificaciones/.env`
- `services/ms5-historial/.env`
- `frontend/.env`

---

## 📁 Estructura del Proyecto

```
SystemAlert/
├── services/
│   ├── ms1-recepcion/           # Node.js - Ingesta MQTT
│   │   ├── src/
│   │   ├── package.json
│   │   └── .env
│   ├── ms2-geolocalización/     # Python - Procesa GPS
│   │   ├── src/
│   │   ├── requirements.txt
│   │   └── .env
│   ├── ms3-prioridad/           # Python - Clasifica alertas
│   │   ├── src/
│   │   ├── requirements.txt
│   │   └── .env
│   ├── ms4-notificaciones/      # Node.js - WebSocket
│   │   ├── src/
│   │   ├── package.json
│   │   └── .env
│   └── ms5-historial/           # Node.js - REST API
│       ├── src/
│       ├── package.json
│       └── .env
├── frontend/                     # React Dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── .env
├── db/
│   ├── migrations/               # Scripts SQL
│   └── seeds/                    # Datos de prueba
├── docker-compose.yml            # Orquestación local
├── nginx.conf                    # Config Nginx
├── README.md                     # Documentación principal
└── CONTRIBUTING.md               # Esta guía
```

---

## 🔧 Desarrollo Backend

### MS1 - Servicio de Recepción (Node.js)

**Ubicación**: `services/ms1-recepcion/`

**Responsabilidad**: Recibir alertas via MQTT y enviarlas a Redis Stream

#### Setup
```bash
cd services/ms1-recepcion
npm install
cp ../../.env .env  # Copiar variables de entorno

# Desarrollo
npm run dev

# Producción
npm run build && npm start

# Testing
npm test
```

**Estructura del Código**:
```
src/
├── mqtt-handler.js      # Conexión con Mosquitto
├── redis-publisher.js   # Publicación a Redis Stream
├── validators.js        # Validación de alertas
└── server.js           # Servidor principal
```

**Endpoint MQTT**:
```
Topic: alerts/incoming
Payload: {
  "device_id": "ESP32_001",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "alert_type": "robo|violencia|accidente",
  "timestamp": 1686393600000
}
```

---

### MS2 - Servicio de Geolocalización (Python)

**Ubicación**: `services/ms2-geolocalización/`

**Responsabilidad**: Enriquecer alertas con información geográfica

#### Setup
```bash
cd services/ms2-geolocalización
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../../.env .env

# Desarrollo
python src/main.py

# Testing
pytest
```

**Dependencias Principales**:
```
redis==4.5.x
geopy==2.3.x
requests==2.31.x
```

**Proceso**:
1. Lee alertas de Redis Stream: `alerts:incoming`
2. Geocodifica coordenadas (manzana, distrito, provincia)
3. Enriquece documento con información geográfica
4. Publica a Redis Stream: `alerts:geo-enriched`

---

### MS3 - Servicio de Prioridad (Python)

**Ubicación**: `services/ms3-prioridad/`

**Responsabilidad**: Clasificar alertas por nivel de prioridad

#### Setup
```bash
cd services/ms3-prioridad
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../../.env .env

# Desarrollo
python src/main.py

# Testing
pytest
```

**Lógica de Prioridad**:
```python
# Basada en tipo de alerta y densidad de incidentes
PRIORITY_RULES = {
    "violencia": {"base": 10, "multiplier": 1.5},
    "robo": {"base": 7, "multiplier": 1.2},
    "accidente": {"base": 5, "multiplier": 1.0}
}
```

**Proceso**:
1. Lee de Redis: `alerts:geo-enriched`
2. Calcula score de prioridad
3. Persiste en PostgreSQL: tabla `alerts`
4. Publica a Redis Stream: `alerts:prioritized`

---

### MS4 - Servicio de Notificaciones (Node.js)

**Ubicación**: `services/ms4-notificaciones/`

**Responsabilidad**: Enviar notificaciones a operadores via WebSocket

#### Setup
```bash
cd services/ms4-notificaciones
npm install
cp ../../.env .env

# Desarrollo
npm run dev

# Producción
npm run build && npm start
```

**Tecnologías**:
- Socket.io para comunicación bidireccional
- Express.js para servidor HTTP
- Redis para eventos distribuidos

**Evento WebSocket**:
```javascript
socket.on('alert:new', {
  id: "uuid",
  device_id: "ESP32_001",
  location: { lat: -12.0464, lon: -77.0428 },
  priority: 9,
  type: "violencia",
  timestamp: Date.now()
})
```

---

### MS5 - Servicio de Historial (Node.js)

**Ubicación**: `services/ms5-historial/`

**Responsabilidad**: Consultar historial de alertas via REST API

#### Setup
```bash
cd services/ms5-historial
npm install
cp ../../.env .env

# Desarrollo
npm run dev

# Producción
npm run build && npm start
```

**Endpoints REST**:

```bash
# Obtener todas las alertas
GET /api/alerts?limit=100&offset=0&order=DESC

# Filtrar por tipo
GET /api/alerts?type=violencia

# Filtrar por rango de fechas
GET /api/alerts?from=2024-01-01&to=2024-12-31

# Filtrar por prioridad
GET /api/alerts?priority_min=7&priority_max=10

# Obtener alerta por ID
GET /api/alerts/:id

# Estadísticas
GET /api/stats?period=week
```

**Response**:
```json
{
  "total": 1450,
  "alerts": [
    {
      "id": "uuid",
      "device_id": "ESP32_001",
      "location": {
        "latitude": -12.0464,
        "longitude": -77.0428,
        "address": "Jiron 28 de Julio, Miraflores"
      },
      "priority": 9,
      "type": "violencia",
      "timestamp": "2024-06-09T10:30:00Z",
      "status": "processed"
    }
  ]
}
```

---

## 🎨 Desarrollo Frontend

### React Dashboard

**Ubicación**: `frontend/`

**Responsabilidad**: Interfaz visual para operadores (mapa, feed, historial)

#### Setup
```bash
cd frontend
npm install
cp ../.env .env

# Desarrollo
npm start

# Build
npm run build

# Testing
npm test
```

#### Tecnologías
- **React 18.x**: Framework principal
- **Leaflet**: Mapas interactivos
- **Socket.io Client**: Conexión WebSocket con MS4
- **Axios**: Requests HTTP a MS5
- **Tailwind CSS** o **Material-UI**: Estilos

#### Estructura de Carpetas
```
src/
├── components/
│   ├── Map/
│   │   ├── Map.jsx           # Componente Leaflet
│   │   └── Map.css
│   ├── Feed/
│   │   ├── AlertFeed.jsx     # Feed en tiempo real
│   │   └── AlertCard.jsx
│   ├── History/
│   │   ├── HistoryTable.jsx  # Tabla de historial
│   │   └── Filters.jsx
│   └── Common/
│       ├── Header.jsx
│       └── Navbar.jsx
├── pages/
│   ├── Dashboard.jsx         # Página principal
│   └── Analytics.jsx
├── services/
│   ├── socketService.js      # Conexión WebSocket
│   └── apiService.js         # Calls a MS5
├── hooks/
│   ├── useAlerts.js
│   └── useMap.js
├── context/
│   └── AlertContext.js       # State global
├── utils/
│   ├── formatters.js
│   └── constants.js
└── App.js
```

#### Flujo de Datos Frontend

```
┌─────────────────────────────────────────────────┐
│         Socket.io Connection (MS4)              │
│         (Real-time alerts)                       │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│         AlertContext / Redux Store              │
│         (Gestiona estado de alertas)            │
└──────────┬──────────────────────────────────────┘
           │
      ┌────┴─────────────────────┐
      ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│   Map Component  │      │  AlertFeed       │
│ (Leaflet + GPS)  │      │ (Lista en vivo)  │
└──────────────────┘      └──────────────────┘
      │
      ├──────────────────────────────────┐
      ▼                                  ▼
┌──────────────────────────────────────────────────┐
│         HTTP Requests (Axios) a MS5              │
│         Historial, filtros, estadísticas         │
└──────────────────────────────────────────────────┘
```

#### Ejemplo: Obtener Alertas en Tiempo Real

```jsx
// src/hooks/useAlerts.js
import { useEffect, useState, useContext } from 'react';
import { AlertContext } from '../context/AlertContext';
import socketService from '../services/socketService';
import apiService from '../services/apiService';

export const useAlerts = () => {
  const { alerts, setAlerts } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Conectar WebSocket para alertas en tiempo real
    socketService.connect();
    
    socketService.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev]);
      // Toast notification
    });

    // Cargar historial inicial
    fetchHistorical();

    return () => socketService.disconnect();
  }, []);

  const fetchHistorical = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAlerts({ limit: 100 });
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return { alerts, loading, refetch: fetchHistorical };
};
```

#### Ejemplo: Componente de Mapa

```jsx
// src/components/Map/Map.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAlerts } from '../../hooks/useAlerts';

const Map = () => {
  const { alerts } = useAlerts();
  
  return (
    <MapContainer center={[-12.0464, -77.0428]} zoom={13} style={{ height: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      {alerts.map(alert => (
        <Marker key={alert.id} position={[alert.location.latitude, alert.location.longitude]}>
          <Popup>
            <div>
              <h4>{alert.type}</h4>
              <p>Prioridad: {alert.priority}</p>
              <p>{alert.location.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
```

---

## 📝 Guía de Commits

Usamos **Conventional Commits** para mantener un histórico limpio:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Tipos de Commit
- `feat`: Nueva característica
- `fix`: Correción de bug
- `docs`: Cambios en documentación
- `style`: Cambios que no afectan lógica (formatting)
- `refactor`: Refactorización sin cambios de funcionalidad
- `perf`: Mejoras de performance
- `test`: Agregar o actualizar tests
- `chore`: Cambios en herramientas, dependencies

### Ejemplos

```bash
# Agregar nueva funcionalidad
git commit -m "feat(ms5): add advanced filtering to history API"

# Corregir bug
git commit -m "fix(frontend): prevent duplicate alerts in feed"

# Refactorización
git commit -m "refactor(ms1): simplify MQTT message validation"

# Documentación
git commit -m "docs: update backend API endpoints in README"
```

---

## 🧪 Testing

### Backend - Node.js

```bash
# En MS1, MS4, MS5
npm test                    # Ejecutar tests
npm run test:watch         # Modo watch
npm run test:coverage      # Coverage report
```

**Ejemplo Test (Jest)**:
```javascript
// src/__tests__/mqtt-handler.test.js
describe('MQTT Handler', () => {
  it('should validate alert format', () => {
    const validAlert = {
      device_id: 'ESP32_001',
      latitude: -12.0464,
      longitude: -77.0428,
      alert_type: 'robo'
    };
    expect(validateAlert(validAlert)).toBe(true);
  });

  it('should reject invalid coordinates', () => {
    const invalidAlert = {
      device_id: 'ESP32_001',
      latitude: 999,  // Inválido
      longitude: -77.0428,
      alert_type: 'robo'
    };
    expect(validateAlert(invalidAlert)).toBe(false);
  });
});
```

### Backend - Python

```bash
# En MS2, MS3
pytest                      # Ejecutar tests
pytest -v                   # Verbose
pytest --cov              # Coverage
```

**Ejemplo Test (Pytest)**:
```python
# src/tests/test_priority.py
def test_priority_calculation():
    alert = {
        'type': 'violencia',
        'lat': -12.0464,
        'lon': -77.0428
    }
    priority = calculate_priority(alert)
    assert priority >= 8

def test_invalid_coordinates():
    alert = {
        'type': 'robo',
        'lat': 999,
        'lon': -77.0428
    }
    with pytest.raises(ValueError):
        calculate_priority(alert)
```

### Frontend - React

```bash
cd frontend
npm test                    # Modo interactive
npm run test:coverage       # Coverage report
```

**Ejemplo Test (React Testing Library)**:
```javascript
// src/__tests__/Map.test.js
import { render, screen } from '@testing-library/react';
import Map from '../components/Map/Map';

describe('Map Component', () => {
  it('should render Leaflet map', () => {
    render(<Map />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should show marker for each alert', () => {
    const { container } = render(<Map alerts={mockAlerts} />);
    const markers = container.querySelectorAll('.leaflet-marker');
    expect(markers.length).toBe(3);
  });
});
```

---

## ✅ Buenas Prácticas

### Código

1. **Linting**: Todos los servicios deben pasar eslint/flake8
   ```bash
   npm run lint     # Node.js
   flake8 src/      # Python
   ```

2. **Formateo**: Usar Prettier (Node.js)
   ```bash
   npm run format
   ```

3. **Type Safety**:
   - Node.js: Considerar TypeScript en futuras versiones
   - Python: Usar type hints
   ```python
   def calculate_priority(alert: dict) -> int:
       ...
   ```

4. **Validación de Entrada**: Validar SIEMPRE datos de usuarios/dispositivos
   ```python
   def validate_alert(data: dict) -> bool:
       required = ['device_id', 'latitude', 'longitude', 'alert_type']
       if not all(k in data for k in required):
           raise ValueError("Missing required fields")
       
       if not -90 <= data['latitude'] <= 90:
           raise ValueError("Invalid latitude")
       
       return True
   ```

### Base de Datos

1. **Migrations**: Usar migrations para cambios en schema
   ```bash
   # Crear migration
   npm run migrate:create -- add_new_column
   
   # Aplicar
   npm run migrate:up
   ```

2. **Índices**: Crear índices para queries frecuentes
   ```sql
   CREATE INDEX idx_alerts_device_id ON alerts(device_id);
   CREATE INDEX idx_alerts_timestamp ON alerts(created_at DESC);
   CREATE INDEX idx_alerts_priority ON alerts(priority DESC);
   ```

3. **Backups**: Hacer backup regularmente
   ```bash
   pg_dump systemalert_db > backup_$(date +%Y%m%d).sql
   ```

### Rendimiento

1. **Caché**: Usar Redis para queries comunes
   ```javascript
   // Caché de estadísticas
   const stats = await redis.get('stats:day');
   if (!stats) {
     stats = await db.query('SELECT ...');
     await redis.setex('stats:day', 3600, JSON.stringify(stats));
   }
   ```

2. **Batch Inserts**: Insertar múltiples registros en una transacción
   ```python
   with db.transaction():
       for alert in alerts:
           db.insert('alerts', alert)
   ```

3. **Logging**: Loguear eventos importantes
   ```javascript
   logger.info('Alert received', { device_id, lat, lon });
   logger.error('Database error', { error: err.message });
   ```

### Seguridad

1. **Nunca commitear secretos**: Usar `.env` y `.gitignore`
   ```
   # .gitignore
   .env
   .env.local
   node_modules/
   __pycache__/
   ```

2. **Validación**: Validar entrada en todos los endpoints
3. **Rate Limiting**: Implementar límites de requests
4. **HTTPS**: En producción será necesario (TLS)

---

## 🚀 Antes de Push

Checklist antes de hacer push:

- [ ] Tests pasan (`npm test` / `pytest`)
- [ ] Código está formateado (`npm run format`)
- [ ] Linter pasa (`npm run lint` / `flake8`)
- [ ] Commit message sigue Conventional Commits
- [ ] No hay archivos `.env` commiteados
- [ ] Documentación actualizada si es necesario
- [ ] Cambios en DB documentados en `db/migrations`

```bash
# Script pre-push
#!/bin/bash
npm run lint && npm test && npm run format
```

---

## 📞 Ayuda & Soporte

- 📖 Ver [README.md](README.md) para arquitectura completa
- 🐛 Reportar bugs en Issues
- 💬 Preguntas en Discussions
- 📧 Contactar al equipo de desarrollo

---

**Última actualización**: Junio 2026
