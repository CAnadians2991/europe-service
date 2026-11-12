#!/bin/bash
# Waits for the DNS switch of one host and turns it on in Caddy at once, so HTTPS works within seconds of the change:
#   dns-switch-watch.sh <host> <caddy file in /srv/caddy-sites> <tag>      e.g. personalwork.com.ua personalwork.com.ua.caddy APEX
# Asks the zone's authoritative name servers every 3 s (no resolver cache); when <host> answers with this server's IP, removes
# the "#<tag> " prefix in the Caddy file, reloads Caddy (it gets the Let's Encrypt certificate right away) and checks HTTPS.
# Before the switch nothing changes; Netlify keeps serving (same database and Bitrix), so visitors never notice.
set -u
HOST=$1 FILE=/srv/caddy-sites/$2 TAG=$3 IP=${IP:-2.31.204.33}
log() { echo "$(date '+%F %T') [$HOST] $*"; }
# the zone = the closest name above (or equal to) HOST that has its own NS records
ZONE=$HOST NS=
while [ -z "$NS" ] && [ "${ZONE#*.}" != "$ZONE" ]; do
  NS=$(dig +noall +answer NS "$ZONE" | awk '$4 == "NS" { print $5; exit }')
  [ -z "$NS" ] && ZONE=${ZONE#*.}
done
[ -n "$NS" ] || { log "no name servers found"; exit 1; }
log "watching via $NS (zone $ZONE) for $IP"
while :; do
  ans=$(dig +short +time=2 +tries=1 @"$NS" "$HOST" A)
  if echo "$ans" | grep -qx "$IP"; then
    log "DNS now: $(echo $ans | tr '\n' ' ') — enabling #$TAG in $FILE"
    sed -i "s/^#$TAG //" "$FILE"
    if docker exec es-dashboard-caddy-1 caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1; then log "caddy reloaded"; else log "CADDY RELOAD FAILED"; fi
    for i in $(seq 1 60); do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$HOST:443:127.0.0.1" "https://$HOST/robots.txt")
      [ "$code" != 000 ] && { log "HTTPS ok ($code) after $i tries"; break; }
      sleep 1
    done
    exit 0
  fi
  sleep 3
done
