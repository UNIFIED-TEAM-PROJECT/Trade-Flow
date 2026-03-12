#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/tradesflow"
DOMAIN="${1:-tradesflow.co.uk}"

echo "Creating app directory at ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"

echo "Copy repository files into ${APP_DIR} before running docker compose."
echo "Example: rsync -av --exclude node_modules ./ ${APP_DIR}/"

cat <<EOF

Next steps:
1. cd ${APP_DIR}
2. cp .env.example .env
3. Update JWT_SECRET and DATABASE_URL values in .env
4. docker compose up --build -d
5. Verify: curl http://127.0.0.1:3000/api/health

Nginx reverse proxy sample:
server {
  server_name ${DOMAIN};
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
  }
}

HTTPS:
- sudo apt install certbot python3-certbot-nginx
- sudo certbot --nginx -d ${DOMAIN}
EOF
