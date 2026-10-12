#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# setup-oracle.sh — TURN A FRESH UBUNTU SERVER INTO THE LUNX SERVER
# ---------------------------------------------------------------------------
# Written for an Oracle Cloud "Always Free" instance running Canonical Ubuntu
# 22.04 or 24.04 (either shape: Ampere A1 or E2.1.Micro), but it works on
# any Ubuntu machine with a public IP. Run it once, as the default `ubuntu`
# user, over SSH:
#
#   curl -fsSL https://raw.githubusercontent.com/CertifiedMonkey992/WebMaster_Design/main/server/deploy/setup-oracle.sh | bash
#
# It installs:
#   · Node.js 22 and git; the repository in /opt/lunx (the server has no npm
#     dependencies, so nothing else is installed)
#   · a `lunx` system user and a systemd service that starts the server on
#     boot and restarts it if it stops (LUNX_ENV=production, database in
#     /var/lib/lunx, listening on 127.0.0.1:8787 only)
#   · Caddy in front of it, with a free, automatically renewed HTTPS
#     certificate for <your-ip>.sslip.io (or LUNX_HOSTNAME if you set one)
#   · firewall rules opening ports 80 and 443 on the machine itself
#   · a nightly database backup in /var/lib/lunx/backups (the last 14 kept)
#
# Run it again at any time: every step is safe to repeat. To update the
# server later: sudo /opt/lunx/server/deploy/update.sh
#
# Settings (environment variables, all optional):
#   LUNX_HOSTNAME   a hostname that already points at this machine
#                   (default: <public-ip-with-dashes>.sslip.io)
#   LUNX_ORIGINS    where the site is served (default: the GitHub Pages site)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO="https://github.com/CertifiedMonkey992/WebMaster_Design.git"
APP_DIR="/opt/lunx"
DATA_DIR="/var/lib/lunx"
ORIGINS="${LUNX_ORIGINS:-https://certifiedmonkey992.github.io}"

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

say "Finding this machine's public address"
IP="$(curl -fsS https://api.ipify.org || true)"
if [ -z "$IP" ]; then echo "Could not find the public IP address. Is the instance's public IP assigned?" >&2; exit 1; fi
HOST="${LUNX_HOSTNAME:-$(echo "$IP" | tr . -).sslip.io}"
echo "Public IP: $IP    Hostname: $HOST"

say "Installing Node.js 22, git and sqlite3"
export DEBIAN_FRONTEND=noninteractive
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
fi
$SUDO apt-get install -y nodejs git sqlite3 debian-keyring debian-archive-keyring apt-transport-https gnupg
node --version

say "Fetching LunX into $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  $SUDO git -C "$APP_DIR" pull --ff-only
else
  $SUDO git clone --depth 1 "$REPO" "$APP_DIR"
fi

say "Creating the lunx user and the data folder"
id lunx >/dev/null 2>&1 || $SUDO useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin lunx
$SUDO mkdir -p "$DATA_DIR/backups"
$SUDO chown -R lunx:lunx "$DATA_DIR"

say "Installing the lunx service"
$SUDO tee /etc/systemd/system/lunx.service >/dev/null <<EOF
[Unit]
Description=LunX server
After=network-online.target
Wants=network-online.target

[Service]
User=lunx
Group=lunx
WorkingDirectory=$APP_DIR
Environment=LUNX_ENV=production
Environment=LUNX_DB=$DATA_DIR/lunx.db
Environment=PORT=8787
Environment=HOST=127.0.0.1
Environment=LUNX_TRUST_PROXY=1
Environment=LUNX_ALLOWED_ORIGINS=$ORIGINS
# Email stays off until these are set (server/README.md → Email):
# Environment=LUNX_SMTP_HOST=
# Environment=LUNX_SMTP_USER=
# Environment=LUNX_SMTP_PASS=
# Environment=LUNX_MAIL_FROM=
ExecStart=/usr/bin/node --disable-warning=ExperimentalWarning --import ./server/resolve.mjs server/main.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
$SUDO systemctl daemon-reload
$SUDO systemctl enable --now lunx
$SUDO systemctl restart lunx

say "Installing Caddy (HTTPS in front of the server)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | $SUDO gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | $SUDO tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  $SUDO apt-get update
  $SUDO apt-get install -y caddy
fi
$SUDO tee /etc/caddy/Caddyfile >/dev/null <<EOF
$HOST {
	encode gzip
	reverse_proxy 127.0.0.1:8787 {
		# Live updates (/api/stream) must not be buffered.
		flush_interval -1
	}
}
EOF

say "Opening ports 80 and 443 on this machine's firewall"
for port in 443 80; do
  if ! $SUDO iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null; then
    # Oracle's Ubuntu images end the INPUT chain with a REJECT rule; the new
    # rules must come before it.
    line="$($SUDO iptables -L INPUT --line-numbers -n | awk '/REJECT/ {print $1; exit}')"
    if [ -n "$line" ]; then
      $SUDO iptables -I INPUT "$line" -p tcp --dport "$port" -m state --state NEW -j ACCEPT
    else
      $SUDO iptables -A INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT
    fi
  fi
done
if command -v netfilter-persistent >/dev/null; then $SUDO netfilter-persistent save; fi
$SUDO systemctl restart caddy

say "Scheduling a nightly backup"
$SUDO tee /etc/cron.daily/lunx-backup >/dev/null <<EOF
#!/bin/sh
# A consistent copy of the database while the server runs; the last 14 kept.
sqlite3 $DATA_DIR/lunx.db ".backup '$DATA_DIR/backups/lunx-\$(date +%F).db'" && chown lunx:lunx $DATA_DIR/backups/*.db
ls -1t $DATA_DIR/backups/lunx-*.db 2>/dev/null | tail -n +15 | xargs -r rm --
EOF
$SUDO chmod +x /etc/cron.daily/lunx-backup

say "Checking"
sleep 3
if curl -fsS http://127.0.0.1:8787/api/health >/dev/null; then echo "The server answers on this machine."; else echo "The server did not answer — see: sudo journalctl -u lunx -n 50" >&2; fi
echo "Waiting for the HTTPS certificate (up to a minute)…"
for _ in $(seq 1 20); do
  if curl -fsS "https://$HOST/api/health" >/dev/null 2>&1; then OK=1; break; fi
  sleep 3
done

if [ "${OK:-}" = 1 ]; then
  say "Done. LunX server: https://$HOST"
  curl -fsS "https://$HOST/api/health"; echo
  echo
  echo "Next: in GitHub → the repository → Settings → Secrets and variables →"
  echo "Actions → Variables, add LUNX_SERVER_URL = https://$HOST"
else
  say "The server is running, but https://$HOST did not answer yet."
  echo "Most often port 80/443 is still closed in Oracle's dashboard (the"
  echo "subnet's security list needs ingress rules for TCP 80 and 443 from"
  echo "0.0.0.0/0). Fix that, then run: sudo systemctl restart caddy"
  echo "and open https://$HOST/api/health in a browser."
fi
