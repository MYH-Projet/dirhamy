FROM node:22-alpine

# 1) Dossier de travail
WORKDIR /app

# 2) Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# 3) Installation propre (ci est mieux que install pour les builds, mais install passe aussi)
RUN npm install
# Add this line to switch mirrors to Cloudflare (often faster/more reliable)
RUN sed -i 's/dl-cdn.alpinelinux.org/dl-cdn.alpinelinux.org/g' /etc/apk/repositories
# Actually, let's use a specific reliable mirror like this:
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories
RUN apk add --no-cache postgresql-client

# 4) Copier le code source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# 5) Arguments et variables d'environnement
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# 6) Documentation des ports (Informationnel pour l'infra)
EXPOSE 3000
EXPOSE 5555

# 7) Commande de démarrage
# Note: C'est le docker-compose qui surchargera ça, mais c'est une bonne pratique de l'avoir
CMD ["npm", "run", "dev"]