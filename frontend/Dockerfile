# ─────────────────────────────────────────
# Stage 1 — build
# ─────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Variables de entorno en build-time — apuntan a los servicios
# Para producción real estas URLs serían el dominio público, no localhost
ARG VITE_MS4_URL=http://localhost:4000
ARG VITE_MS5_URL=http://localhost:5000
ENV VITE_MS4_URL=$VITE_MS4_URL
ENV VITE_MS5_URL=$VITE_MS5_URL

RUN npm run build

# ─────────────────────────────────────────
# Stage 2 — serve con Nginx
# ─────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
