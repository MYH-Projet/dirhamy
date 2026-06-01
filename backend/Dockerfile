FROM node:22-alpine

WORKDIR /app

# Dépendances d'abord (cache Docker)
COPY package.json package-lock.json ./

# Build reproducible (meilleur pour CI)
RUN npm ci

# Code source
COPY . .

EXPOSE 3000
EXPOSE 5555

# IMPORTANT:
# - Ne pas faire "npx prisma generate" au build
# - Le faire au runtime (DATABASE_URL sera fourni par docker-compose/.env)
CMD ["sh", "-c", "npx prisma generate && npm run dev"]