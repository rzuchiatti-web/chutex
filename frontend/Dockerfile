# ───────── Stage 1 : build Vite ─────────
FROM node:20-alpine AS build

WORKDIR /app

# Variables d'env injectées dans le bundle Vite à la build (REACT_APP_* / VITE_*)
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_VAPID_KEY
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_VAPID_KEY=$REACT_APP_VAPID_KEY

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ───────── Stage 2 : serve avec nginx ─────────
FROM nginx:1.27-alpine

# Config nginx custom (SPA history fallback + gzip + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie le build statique
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
