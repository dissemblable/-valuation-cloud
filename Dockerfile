# Dockerfile — image de production pour l'app TODO
# Multi-stage pour réduire la taille finale

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine
WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code applicatif
COPY package*.json ./
COPY server.js ./
COPY src ./src
COPY public ./public

# Lancer en utilisateur non-root (bonne pratique de sécurité)
USER node

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
