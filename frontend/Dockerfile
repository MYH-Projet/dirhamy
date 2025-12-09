FROM nginx:alpine

# Supprimer la page par défaut Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier tes fichiers frontend
COPY . /usr/share/nginx/html

# Copier la config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
