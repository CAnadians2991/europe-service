#!/bin/bash
# Build and start the site on the server from the bare repo /srv/<name>.git (branch main):
#   from the Mac: git push vps main   → the post-receive hook runs this script in the background (log: /srv/<name>/deploy.log)
#   by hand:      ssh es-vps-deploy /srv/<name>/deploy.sh
# The old container keeps serving during the build; the switch takes a few seconds, and Caddy holds requests meanwhile.
set -euo pipefail
NAME="${NAME:-$(basename "$(dirname "$(readlink -f "$0")")")}"
DIR="/srv/$NAME"
REPO="/srv/$NAME.git"
BRANCH="${BRANCH:-main}"
cd "$DIR"
exec 9>"$DIR/.deploy.lock"
flock -n 9 || { echo "$(date '+%F %T') another deploy of $NAME is running"; exit 1; }

REV=$(git --git-dir="$REPO" rev-parse "$BRANCH")
echo "$(date '+%F %T') deploy $NAME $BRANCH $REV"
rm -rf app.new && mkdir app.new
git --git-dir="$REPO" archive "$REV" | tar -x -C app.new
rm -rf app.old && { [ -d app ] && mv app app.old || true; } && mv app.new app
cp app/deploy/vps/compose.yml compose.yml
cp app/deploy/vps/deploy.sh deploy.sh.new && chmod +x deploy.sh.new && mv deploy.sh.new deploy.sh

export REBUILD_ID="$(date +%s)-$REV"
if ! docker compose build web; then
  echo "$(date '+%F %T') BUILD FAILED — the running container is untouched"
  rm -rf app && mv app.old app
  exit 1
fi
docker compose up -d web
for i in $(seq 1 60); do
  s=$(docker inspect -f '{{.State.Health.Status}}' "$NAME-web" 2>/dev/null || echo none)
  [ "$s" = healthy ] && break
  sleep 2
done
echo "$(date '+%F %T') container: $s"
echo "$REV" > REVISION
rm -rf app.old
docker image prune -f >/dev/null
docker builder prune -f --filter until=72h >/dev/null || true
echo "$(date '+%F %T') done $REV"
