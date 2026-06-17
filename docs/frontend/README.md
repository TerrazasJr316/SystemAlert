# 🖥️ Frontend - Dashboard de Alertas

## ¿Qué es?

La interfaz visual del sistema. Es donde los operadores ven las alertas en un mapa y pueden consultar el historial.

**Ubicación:** `/frontend`  
**Tecnología:** React + Vite + Leaflet (mapas)  
**Puerto:** `5173`

---

## 🎯 Funcionalidades Principales

| Funcionalidad | Descripción |
|---|---|
| **Mapa Interactivo** | Ver alertas en tiempo real sobre un mapa |
| **Feed en Vivo** | Nuevas alertas aparecen automáticamente (websocket) |
| **Historial** | Buscar y filtrar alertas pasadas |
| **Detalles de Alerta** | Ver datos completos: ubicación, tipo, prioridad |
| **Estadísticas** | Contar alertas por zona y tipo |

---

## 🚀 Cómo Ejecutar

### Opción 1: Con Docker (Recomendado)
```bash
docker-compose up frontend
```

Luego accede a: **http://localhost:5173**

### Opción 2: Manual (desarrollo local)

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 📁 Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/
│   │   ├── TopBar.jsx          # Barra superior con título
│   │   ├── MapPanel.jsx        # Mapa interactivo (Leaflet)
│   │   ├── LiveFeed.jsx        # Feed de alertas en tiempo real
│   │   ├── HistoryPanel.jsx    # Panel de historial
│   │   └── StatsBar.jsx        # Barra de estadísticas
│   ├── App.jsx                 # Componente principal
│   ├── App.css                 # Estilos globales
│   └── main.jsx                # Punto de entrada
├── package.json
├── vite.config.js              # Configuración de Vite
└── tailwind.config.js          # Configuración de estilos
```

---

## 🔧 Configuración Básica

### Variables de Entorno

Crea un archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

**Notas:**
- `VITE_API_URL`: URL del backend (para historial y búsqueda)
- `VITE_WS_URL`: Websocket para alertas en tiempo real

---

## 🛠️ Tareas Comunes

### Cambiar el mapa
El mapa usa **Leaflet** + OpenStreetMap. Para cambiar el proveedor de mapas, edita `MapPanel.jsx`:

```javascript
// Cambiar provider del mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
```

### Agregar un nuevo filtro al historial
Edita `HistoryPanel.jsx` y agrega un filtro en el componente:

```javascript
const [filtro, setFiltro] = useState('');

// En el formulario
<input 
  value={filtro} 
  onChange={(e) => setFiltro(e.target.value)}
  placeholder="Filtrar por tipo..."
/>
```

### Cambiar colores y estilos
Los estilos se definen en `tailwind.config.js` o `App.css`. Busca la clase y modifica los valores.

---

## 📊 Conexión con Backend

### Obtener alertas en vivo (WebSocket)

```javascript
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL);

socket.on('nueva_alerta', (data) => {
  console.log('Alerta recibida:', data);
  // Actualizar el mapa
});
```

### Obtener historial (REST API)

```javascript
fetch(`${import.meta.env.VITE_API_URL}/alertas`)
  .then(res => res.json())
  .then(data => console.log('Alertas históricas:', data));
```

---

## 🐛 Problemas Comunes

### El mapa no carga
- ✅ Verifica que Leaflet esté instalado: `npm install leaflet`
- ✅ Comprueba que no hay errores en consola (F12)
- ✅ Revisa que la API de tiles del mapa esté disponible

### Las alertas no se actualizan en tiempo real
- ✅ Verifica que el servidor WebSocket está corriendo
- ✅ Comprueba la URL en `.env`: `VITE_WS_URL`
- ✅ Abre la consola (F12) y busca errores de conexión WebSocket

### Styles no se aplican
- ✅ Ejecuta: `npm install -D tailwindcss`
- ✅ Verifica que `tailwind.config.js` esté bien configurado

---

## 📱 Responsive Design

El dashboard es completamente responsive:
- ✅ Desktop: vista completa con mapa grande
- ✅ Tablet: ajuste automático de componentes
- ✅ Mobile: menú colapsable

Para probar: abre DevTools (F12) → dispositivo → selecciona un tamaño

---

## 🎨 Cambios Rápidos Útiles

### Cambiar el logo/título
Edita `TopBar.jsx`:
```javascript
<h1>Mi Sistema de Alertas</h1>
```

### Cambiar tiempo de actualización del feed
Edita `LiveFeed.jsx`:
```javascript
setInterval(() => {
  // Actualizar cada 5 segundos
}, 5000); // Cambiar este número
```

### Agregar más información a una alerta
Edita el componente correspondiente y agrega campos del JSON que devuelve la API.

---

## 📖 Recursos Útiles

- **Leaflet Docs:** https://leafletjs.com/
- **React Docs:** https://react.dev/
- **Vite Docs:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/

---

## 💡 Tips

- Usa `npm run dev` para desarrollo y recarga automática
- Abre DevTools (F12) para ver errores y logs
- Usa `console.log()` para debugging
- Guarda archivos = recarga automática en el navegador

---

**¿Necesitas más ayuda?** Revisa los logs del contenedor:
```bash
docker-compose logs -f frontend
```
