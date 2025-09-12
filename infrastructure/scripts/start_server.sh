#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

APP_DIR="/var/www/k-mate"
SERVICE_NAME="kmate"   # systemd 서비스명 (kmate.service)

# ------ Node 앱 systemd 서비스 재기동 ------
systemctl daemon-reload || true
systemctl enable "${SERVICE_NAME}" || true

# ------ nginx 설치(없으면) ------
if ! command -v nginx >/dev/null 2>&1; then
  echo "[start_server] nginx not found. installing..."
  if command -v dnf >/dev/null 2>&1; then
    # Amazon Linux 2023
    dnf install -y nginx
  elif command -v amazon-linux-extras >/dev/null 2>&1; then
    # Amazon Linux 2
    amazon-linux-extras enable nginx1 || true
    yum clean metadata || true
    yum install -y nginx
  elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y nginx
  else
    echo "[start_server] Unsupported OS. Install nginx manually." >&2
    exit 1
  fi
fi

# ------ nginx 설정 배치(레포에 포함했다면) ------
# 예: artifact에 포함된 infrastructure/nginx/k-mate.conf → /etc/nginx/conf.d/k-mate.conf
if [ -f "${APP_DIR}/infrastructure/nginx/k-mate.conf" ]; then
  cp -f "${APP_DIR}/infrastructure/nginx/k-mate.conf" /etc/nginx/conf.d/k-mate.conf
fi

# ------ nginx 설정 확인 및 기동 ------
nginx -t
systemctl enable nginx
systemctl restart nginx

# ------ Node 앱 기동 ------
systemctl restart "${SERVICE_NAME}"

echo "[start_server] DONE"
