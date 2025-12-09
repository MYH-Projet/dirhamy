FROM nginx:alpine

# Supprimer la config par défaut d’Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Ajouter ta configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier tes fichiers HTML/CSS/JS
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
