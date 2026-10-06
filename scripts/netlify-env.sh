#!/bin/bash
# Copies the site's secrets from .env.local into Netlify (project personalwork-ua, production).
# Values are never printed. Run from anywhere:  bash scripts/netlify-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
N="npx -y netlify-cli@latest"

get() { grep -E "^$1=" .env.local | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

# the database and file storage are Netlify's own (no variables needed)
for k in ADMIN_PASSWORD; do
  v="$(get "$k")"
  if [ -z "$v" ]; then echo "✗ $k is missing in .env.local"; exit 1; fi
  $N env:set "$k" "$v" --secret --context production >/dev/null
  echo "✓ $k"
done

# session-signing key: a fresh random one (admins simply log in again)
$N env:set ADMIN_SECRET "$(openssl rand -hex 32)" --secret --context production >/dev/null
echo "✓ ADMIN_SECRET (new)"

# Bitrix24 incoming webhook (secret link). Paste it when asked; Enter skips (leads then keep going via the old os_tilda script)
read -r -s -p "Посилання вебхука Bitrix (Enter — пропустити): " BX; echo
if [ -n "$BX" ]; then
  $N env:set BITRIX_WEBHOOK_URL "$BX" --secret --context production >/dev/null
  echo "✓ BITRIX_WEBHOOK_URL"
fi

echo "Done — tell Claude «готово»."
