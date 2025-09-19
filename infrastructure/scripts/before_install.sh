#!/bin/bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

log() { echo "[before_install] $*"; }

log "/etc/os-release:"
cat /etc/os-release || true

# 디렉터리 준비
install -d -o ec2-user -g ec2-user /var/www/k-mate/server /var/www/k-mate/client
install -d -o ec2-user -g ec2-user /srv/k-mate/shared
chown -R ec2-user:ec2-user /var/www/k-mate || true

# OS 판별
ID="$(. /etc/os-release; echo "${ID}")"
VER_ID="$(. /etc/os-release; echo "${VERSION_ID}")"

need_node_install=true
if command -v node >/dev/null 2>&1; then
  # 이미 설치된 경우 메이저 버전 확인
  NODE_V="$(node -v 2>/dev/null || echo v0.0.0)"
  NODE_MAJOR="${NODE_V#v}"; NODE_MAJOR="${NODE_MAJOR%%.*}"
  if [[ "${NODE_MAJOR}" =~ ^[0-9]+$ ]] && [ "${NODE_MAJOR}" -ge 20 ]; then
    need_node_install=false
    log "node already installed: ${NODE_V}"
  else
    log "node found (${NODE_V}) but < 20. Will upgrade to 20."
  fi
else
  log "node not found. Will install."
fi

if [ "${need_node_install}" = true ]; then
  if [[ "${ID}" == "amzn" && "${VER_ID%%.*}" -ge 2023 ]]; then
    # Amazon Linux 2023: 공식 리포에서 20 설치
    log "Installing Node.js 20 from amazonlinux repo (AL2023)"
    dnf clean all -y || true
    dnf -y install nodejs20 nodejs20-npm
    # alternatives로 기본 node/npm 지정 (실패해도 무시)
    alternatives --set node /usr/bin/node-20 || true
    alternatives --set npm  /usr/bin/npm-20  || true

  elif [[ "${ID}" == "amzn" && "${VER_ID%%.*}" -lt 2023 ]]; then
    # Amazon Linux 2: NodeSource로 20 설치 (인터넷 필요)
    log "Installing Node.js 20 via NodeSource (AL2)"
    yum install -y curl ca-certificates || true
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs

  elif [[ "${ID}" == "ubuntu" || "${ID}" == "debian" ]]; then
    # Ubuntu/Debian: NodeSource로 20 설치 (인터넷 필요)
    log "Installing Node.js 20 via NodeSource (Debian/Ubuntu)"
    apt-get update -y
    apt-get install -y curl ca-certificates gnupg
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    # (일부 배포판) 바이너리명이 nodejs인 경우 보정
    if ! command -v node >/dev/null 2>&1 && [ -x /usr/bin/nodejs ]; then
      ln -sf /usr/bin/nodejs /usr/bin/node
    fi

  else
    log "Unsupported OS (${ID} ${VER_ID}). Please pre-install Node.js 20."
    exit 1
  fi
fi

log "which node: $(command -v node || echo N/A)"
log "node -v: $(node -v || echo N/A)"
log "which npm : $(command -v npm  || echo N/A)"
log "npm -v : $(npm -v || echo N/A)"

# 서비스 중지는 ApplicationStop 훅에서 이미 수행되므로, 여기서는 존재 시만 안전하게 중지
systemctl stop kmate.service || true

log "before_install completed."
