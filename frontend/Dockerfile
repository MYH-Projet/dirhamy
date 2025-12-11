FROM nginx:alpine

# Supprimer la config par défaut de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Ajouter ta configuration au lieau de defaut 
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier tes fichiers HTML/CSS/JS dans l endroit de travail de nginx
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
