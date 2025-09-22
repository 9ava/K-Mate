#!/bin/bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

log(){ echo "[after_install] $*"; }

APP_DIR="/var/www/k-mate/server"
CLIENT_DIR="/var/www/k-mate/client"
ENV_PATH="/srv/k-mate/shared/k-mate.env"

# 옵션 토글(필요 시 appspec/env에서 주입 가능)
INSTALL_PROD_DEPS="${INSTALL_PROD_DEPS:-true}"   # node_modules 없을 때 npm ci --omit=dev 수행 여부
RUN_MIGRATIONS="${RUN_MIGRATIONS:-false}"        # 배포 시 마이그레이션 실행 여부

# 0) 기본 검증
log "cd ${APP_DIR}"
cd "${APP_DIR}"

# .env 필수(google oauth 등)
if [ ! -f "${ENV_PATH}" ]; then
  log "ERROR: ${ENV_PATH} 가 없습니다. render_env.sh 훅이 먼저 실행되어야 합니다."
  exit 1
fi

# dist 산출물 확인
if [ ! -f "${APP_DIR}/dist/main.js" ]; then
  log "ERROR: dist/main.js 가 없습니다. 빌드 산출물이 누락되었습니다."
  ls -la "${APP_DIR}" || true
  exit 1
fi
log "OK: dist/main.js 존재"

# 1) Node 20 보장
if command -v node >/dev/null 2>&1; then
  NODE_V="$(node -v 2>/dev/null || echo v0.0.0)"
  NODE_MAJOR="${NODE_V#v}"; NODE_MAJOR="${NODE_MAJOR%%.*}"
  if [[ "${NODE_MAJOR}" =~ ^[0-9]+$ ]] && [ "${NODE_MAJOR}" -lt 20 ]; then
    log "node ${NODE_V} (<20) 감지 → alternatives 로 node-20 지정 시도"
    sudo alternatives --set node /usr/bin/node-20 2>/dev/null || true
    sudo alternatives --set npm  /usr/bin/npm-20  2>/dev/null || true
  fi
else
  log "경고: node 명령을 찾을 수 없습니다. before_install.sh 에서 설치되어야 합니다."
fi

log "which node: $(command -v node || echo N/A)"
log "node -v: $(node -v || echo N/A)"
log "which npm : $(command -v npm  || echo N/A)"
log "npm -v : $(npm -v || echo N/A)"

# 2) node_modules 처리
if [ -d "${APP_DIR}/node_modules" ]; then
  log "OK: node_modules 존재. 의존성 설치 생략"
else
  if [ "${INSTALL_PROD_DEPS}" = "true" ]; then
    if command -v npm >/dev/null 2>&1 && [ -f "${APP_DIR}/package.json" ]; then
      log "node_modules 미존재 → 프로덕션 의존성 설치 (npm ci --omit=dev)"
      npm ci --omit=dev
    else
      log "ERROR: node_modules 없음 + npm 혹은 package.json 없음 → 배포 실패"
      ls -la "${APP_DIR}" || true
      exit 1
    fi
  else
    log "설정상 INSTALL_PROD_DEPS=false 이므로 node_modules 미존재 시 실패"
    exit 1
  fi
fi

# 3) 권한/소유권 정리
log "권한/소유권 정리"
sudo chown -R ec2-user:ec2-user /var/www/k-mate
sudo chmod -R u=rwX,g=rX,o=rX /var/www/k-mate || true

# 3.5) ✅ NGINX upstream 중복 제거 가드 (idempotent)
log "NGINX upstream 설정 정리(중복 제거 + 표준 파일 생성)"

# 3.5.1 표준 업스트림 파일을 강제로 재작성 (항상 동일 상태 보장)
sudo tee /etc/nginx/conf.d/10-upstreams.conf >/dev/null <<'EOF'
upstream kmate_upstream {
  server 127.0.0.1:3000;
  keepalive 64;
}
EOF

# 3.5.2 다른 conf들에서 동일 upstream 블록이 있으면 제거
for f in /etc/nginx/conf.d/*.conf; do
  base="$(basename "$f")"
  [ "$base" = "10-upstreams.conf" ] && continue
  # upstream kmate_upstream { ... } 블록 제거
  sudo sed -i '/^[[:space:]]*upstream[[:space:]]\+kmate_upstream[[:space:]]*{/,/^[[:space:]]*}/d' "$f"
done

# 3.5.3 (선택) connection_upgrade 맵 파일 확장자 보정
if [ -f /etc/nginx/conf.d/00-connection-upgrade.map ] && [ ! -f /etc/nginx/conf.d/00-connection-upgrade.conf ]; then
  sudo mv /etc/nginx/conf.d/00-connection-upgrade.map /etc/nginx/conf.d/00-connection-upgrade.conf
fi

# 4) systemd / nginx 재적용(문법 검사 포함)
log "systemd daemon-reload"
sudo systemctl daemon-reload

log "nginx -t"
if ! sudo nginx -t; then
  # 실패 시 디버깅 도움 로그
  log "nginx -T (요약)"
  sudo nginx -T 2>&1 | egrep -n 'upstream kmate_upstream|server_name|listen 80|location \^~ /auth/|try_files .* /index\.html' || true
  exit 1
fi

log "nginx reload"
sudo systemctl reload nginx || sudo systemctl restart nginx

# 5) (옵션) DB 마이그레이션
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  log "DB 마이그레이션 실행"
  # 예) npm run migration:run
  # 또는 npx typeorm migration:run -d dist/database/data-source.js
fi

log "after_install 완료"
