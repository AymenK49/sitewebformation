# Stage de build
FROM node:18-alpine as build

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Stage de production
FROM nginx:alpine

# Copie de la configuration nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers buildés
COPY --from=build /app/build /usr/share/nginx/html

# Exposition du port
EXPOSE 80

# Démarrage de nginx
CMD ["nginx", "-g", "daemon off;"]