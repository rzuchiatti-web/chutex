# ───────── Stage 1 : build Vite ─────────
FROM node:20-alpine AS build

WORKDIR /app

# Variables d'env injectées dans le bundle Vite à la build (REACT_APP_* / VITE_*)
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_VAPID_KEY
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_VAPID_KEY=$REACT_APP_VAPID_KEY

# Copie package.json + lock file (yarn.lock OU package-lock.json — selon ce qui est commité)
COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f yarn.lock ]; then \
        echo "→ Install via yarn (lockfile présent)"; \
        yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        echo "→ Install via npm ci (yarn.lock absent, fallback package-lock.json)"; \
        npm ci; \
    else \
        echo "→ Install via yarn (sans lockfile — non reproductible !)"; \
        yarn install; \
    fi

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
