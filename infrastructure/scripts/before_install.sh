#!/bin/bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

mkdir -p /var/www/k-mate
chown -R ec2-user:ec2-user /var/www/k-mate || true

echo "[before_install] /etc/os-release:"
cat /etc/os-release || true

# Node 실행기 없는 경우 설치
if ! command -v node >/dev/null 2>&1; then
  echo "[before_install] node not found. installing..."

  if command -v dnf >/dev/null 2>&1; then
    # Amazon Linux 2023
    dnf install -y nodejs npm || true
    # 필요시 NodeSource로 보강
    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      dnf install -y nodejs
    fi

  elif command -v amazon-linux-extras >/dev/null 2>&1; then
    # Amazon Linux 2
    amazon-linux-extras enable nodejs20 || amazon-linux-extras enable nodejs18 || true
    yum clean metadata
    yum install -y nodejs npm || true
    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      yum install -y nodejs
    fi

  elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y curl ca-certificates gnupg
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    # 우분투 일부는 nodejs 바이너리명 보정
    if ! command -v node >/dev/null 2>&1 && [ -x /usr/bin/nodejs ]; then
      ln -sf /usr/bin/nodejs /usr/bin/node
    fi

  else
    echo "[before_install] 지원되지 않는 OS입니다. 수동 설치 필요" >&2
    exit 1
  fi
else
  echo "[before_install] node already installed"
fi

# 과거 순환 심볼릭 링크 정리(있을 때만)
for b in node npm; do
  if [ -L "/usr/bin/$b" ] && [ "$(readlink -f /usr/bin/$b)" = "/usr/bin/$b" ]; then
    rm -f "/usr/bin/$b"
  fi
done

echo "[before_install] which node: $(command -v node || echo N/A)"
echo "[before_install] node -v: $(node -v || echo N/A)"
echo "[before_install] which npm : $(command -v npm  || echo N/A)"
echo "[before_install] npm -v : $(npm -v || echo N/A)"

# 이전 프로세스 중지(있으면)
systemctl stop kmate.service || true
