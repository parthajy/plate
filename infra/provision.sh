#!/usr/bin/env bash
# One-time droplet bootstrap. Idempotent — safe to re-run.
# Run as root on a fresh Ubuntu 24.04 droplet.

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
NODE_MAJOR="${NODE_MAJOR:-20}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

echo "==> apt update + base packages"
apt-get update -y
apt-get install -y --no-install-recommends \
  curl ca-certificates gnupg debian-keyring debian-archive-keyring \
  apt-transport-https ufw unattended-upgrades fail2ban git

echo "==> Create $DEPLOY_USER if missing"
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  mkdir -p "/home/$DEPLOY_USER/.ssh"
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/"
  fi
  chown -R "$DEPLOY_USER":"$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  chmod 700 "/home/$DEPLOY_USER/.ssh"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys" 2>/dev/null || true
fi

echo "==> Postgres 16"
if ! command -v psql &>/dev/null; then
  apt-get install -y postgresql-16 postgresql-contrib
fi
systemctl enable --now postgresql

echo "==> Node $NODE_MAJOR via NodeSource"
if ! command -v node &>/dev/null; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

echo "==> PM2"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

echo "==> Caddy"
if ! command -v caddy &>/dev/null; then
  curl -fsSL "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> Firewall (ufw)"
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "==> Unattended security upgrades"
dpkg-reconfigure -fnoninteractive unattended-upgrades

echo "==> SSH hardening (password auth off)"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd || true

cat <<MSG

Provisioning complete.

Next, manually:
  1. As '$DEPLOY_USER':
       sudo -u postgres createuser --pwprompt plate
       sudo -u postgres createdb -O plate plate_prod
  2. Clone the repo into ~/plate.
  3. Copy infra/Caddyfile to /etc/caddy/Caddyfile, then 'systemctl reload caddy'.
  4. Point api.plate.best DNS at this droplet's IP. Caddy will fetch a cert on first boot.
  5. cp backend/.env.example backend/.env  # fill in real secrets
  6. cd backend && npm ci && npm run build && npm run db:migrate
  7. pm2 start ecosystem.config.cjs && pm2 startup && pm2 save

MSG
