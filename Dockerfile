FROM node:22-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm install

# Copie du code source complet
COPY . .

# Construction du bundle frontend de production
RUN npm run build

# Variables de production
ENV NODE_ENV=production
ENV PORT=8000

# Port réseau exposé
EXPOSE 8000

# Commande de démarrage
CMD ["npm", "start"]
