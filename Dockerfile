# syntax=docker/dockerfile:1

# Dockerfile de producción (build + serve estático). En desarrollo el
# contenedor "frontend" del docker-compose.yml raíz no usa esta imagen —
# corre "npm run dev" directo sobre node:20.20.0 con el código por bind
# mount, ver DECISIONES.md ("Estructura de archivos").
#
# node:20.20.0-slim (imagen oficial) en las 3 stages, no refinedev/node:18
# (imagen de terceros, versión de Node desalineada con la ya decidida para
# este proyecto) — ver DECISIONES.md, sección Deploy/ARM.

# ---- Stage: deps -------------------------------------------------------
FROM node:20.20.0-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --legacy-peer-deps: @typescript-eslint/eslint-plugin y @typescript-eslint/parser
# (v5, sin usar de verdad — el eslint.config.js real usa el paquete unificado
# "typescript-eslint" v8) piden eslint@^8, en conflicto con eslint@^9.25.0 del
# proyecto. "npm ci" es estricto con esto y sin el flag falla. No se sacan esas
# 2 dependencias muertas de package.json a propósito (decisión explícita del
# usuario, alcance acotado a este Dockerfile).
RUN npm ci --legacy-peer-deps

# ---- Stage: builder -----------------------------------------------------
FROM node:20.20.0-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# VITE_API_URL de producción sale de frontend/.env.production (commiteado,
# no es secreto — solo la URL pública del backend). Vite lo carga solo al
# buildear en modo "production" (default de "vite build"/"refine build"),
# sin pisar el .env de desarrollo.
RUN npm run build

# ---- Stage: runner -------------------------------------------------------
FROM node:20.20.0-slim AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
