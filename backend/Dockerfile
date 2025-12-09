FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# On définit DATABASE_URL pour Prisma au moment du build
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
