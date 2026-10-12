#!/usr/bin/env bash
# update.sh — bring the LunX server up to date with main and restart it.
#   sudo /opt/lunx/server/deploy/update.sh
# The database is untouched (it lives in /var/lib/lunx); new migrations run
# when the server starts. Take a backup first if a release changes the schema:
#   sudo /etc/cron.daily/lunx-backup
set -euo pipefail
git -C /opt/lunx pull --ff-only
systemctl restart lunx
sleep 2
curl -fsS http://127.0.0.1:8787/api/health && echo
