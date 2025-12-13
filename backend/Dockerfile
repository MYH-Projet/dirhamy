# ✅ CORRECTION : On passe sur la version LTS stable (20)
FROM node:22-alpine

# 1) Dossier de travail
WORKDIR /app

# 2) Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# 3) Installation propre (ci est mieux que install pour les builds, mais install passe aussi)
RUN npm install

# 4) Copier le code source
COPY . .

# 5) Arguments et variables d'environnement
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# 6) Documentation des ports (Informationnel pour l'infra)
EXPOSE 3000
EXPOSE 5555

# 7) Commande de démarrage
# Note: C'est le docker-compose qui surchargera ça, mais c'est une bonne pratique de l'avoir
CMD ["npm", "run", "dev"]