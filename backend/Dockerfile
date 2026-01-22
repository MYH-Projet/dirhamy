FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# optionnel : seulement si tu utilises psql dans le conteneur
RUN apk add --no-cache postgresql-client

COPY . .

EXPOSE 3000
EXPOSE 5555

# Prisma generate au runtime (DATABASE_URL sera fourni par docker-compose / env)
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
