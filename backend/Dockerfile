# Image Node compatible avec Prisma 7
FROM node:24-alpine

# 1) Dossier de travail dans le conteneur
WORKDIR /app

# 2) Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# 3) Installer TOUTES les dépendances (dev + prod)
#    -> nécessaire pour tsx, jest, prisma, etc.
RUN npm install

# 4) Copier le code source du backend
COPY . .

# 5) Optionnel : définir la variable pour Prisma (utile si tu l'utilises dans prisma.config.ts)
#    Elle sera écrasée par la valeur qu'on donne dans docker-compose
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# ⚠️ On NE lance PAS prisma migrate ici !
#    On NE lance PAS non plus prisma generate ici,
#    car on veut qu'ils utilisent la vraie DATABASE_URL de docker-compose.

# 6) Exposer le port de ton backend Express
EXPOSE 3000
EXPOSE 5555


# 7) Commande de démarrage du conteneur
#    Les migrations Prisma seront lancées via docker-compose (command: ...)
CMD ["npm", "run", "dev"]
