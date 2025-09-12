#!/bin/bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

APP_DIR="/var/www/k-mate/server"
cd "$APP_DIR"

# node_modules가 포함되어 왔는지 확인
if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "[after_install] node_modules 가 없습니다. buildspec에서 패키징했는지 확인하세요." >&2
  ls -la "$APP_DIR" || true
  exit 1
fi

echo "[after_install] node_modules 존재 확인 완료. npm 호출 불필요."
