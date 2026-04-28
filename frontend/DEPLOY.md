# Déploiement du site web Chutex Care

Le frontend est une SPA **React + Vite + TailwindCSS**, packagée pour
être servie par **nginx** dans un conteneur Docker.

## 🏗️ Build

Les variables d'environnement préfixées `REACT_APP_` ou `VITE_` sont
**injectées dans le bundle au moment du build**. Tu dois donc les passer
à `docker build` via `--build-arg`.

### Build local

```bash
cd frontend
docker build \
  --build-arg REACT_APP_BACKEND_URL=https://api.chutex-care.fr \
  --build-arg REACT_APP_VAPID_KEY=... \
  -t chutex-website:latest .
```

### Run

```bash
docker run -d --name chutex-web -p 80:80 chutex-website:latest
# ou sur un autre port :
docker run -d --name chutex-web -p 8080:80 chutex-website:latest
```

Le site est accessible sur `http://<host>/`.

## 🚀 Déploiement type (serveur Linux)

### 1. Build

```bash
git clone <ton-repo>.git chutex-care && cd chutex-care/frontend
docker build \
  --build-arg REACT_APP_BACKEND_URL=https://api.chutex-care.fr \
  -t chutex-website:latest .
```

### 2. Reverse-proxy (nginx hôte) — optionnel mais recommandé

Si tu mets un reverse-proxy nginx devant pour gérer SSL :

```nginx
server {
    listen 443 ssl http2;
    server_name www.chutex-care.fr chutex-care.fr;

    ssl_certificate     /etc/letsencrypt/live/chutex-care.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chutex-care.fr/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name www.chutex-care.fr chutex-care.fr;
    return 301 https://$host$request_uri;
}
```

### 3. Docker Compose (web + API + DB)

Voir `docker-compose.yml` à la racine du repo pour démarrer **frontend
+ API + Postgres** en une seule commande.

## 🔧 Configuration

### Variables d'environnement (build-time)

| Variable                 | Description                                | Exemple                         |
|--------------------------|--------------------------------------------|---------------------------------|
| `REACT_APP_BACKEND_URL`  | URL absolue de l'API (sans `/api`)         | `https://api.chutex-care.fr`    |
| `REACT_APP_VAPID_KEY`    | Clé publique Web Push (VAPID)              | `BE6moMDU-MVI...`               |

⚠️ Ces variables sont **figées dans le bundle au moment du build**. Pour
changer l'URL de l'API en prod, il faut **rebuild** l'image.

### Configuration nginx fournie

`nginx.conf` inclut :
- ✅ **SPA history fallback** (`try_files ... /index.html`)
- ✅ **Compression gzip** (HTML, CSS, JS, fonts, SVG)
- ✅ **Cache long** sur les assets versionnés (1 an, immutable)
- ✅ **No-cache** sur `index.html` (déploiement instantané)
- ✅ **En-têtes de sécurité** (X-Frame-Options, X-Content-Type-Options, …)
- ✅ **Healthcheck** sur `/healthz`

## 🩺 Healthcheck

```bash
curl http://localhost/healthz
# → ok
```

## 🔄 Mise à jour en production

```bash
git pull
docker build --build-arg REACT_APP_BACKEND_URL=... -t chutex-website:latest .
docker stop chutex-web && docker rm chutex-web
docker run -d --name chutex-web -p 80:80 chutex-website:latest
```

Avec Docker Compose :

```bash
git pull
docker compose up -d --build web
```

## 📦 Taille du bundle

Le build Vite produit un bundle optimisé dans `dist/` :
- HTML / CSS / JS hashés
- Code splitting automatique
- Tree-shaking
- Préfetch sur les routes lazy-loadées

Pour analyser la taille, ajoute `vite-bundle-visualizer` :

```bash
yarn add -D vite-bundle-visualizer
yarn build && open dist/stats.html
```
