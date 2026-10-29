#!/usr/bin/env bash
set -Eeuo pipefail

trap 'code=$?; printf "::error::Deployment failed at line %s (exit %s).\n" "$LINENO" "$code" >&2; exit "$code"' ERR
fail() {
  printf '::error::%s\n' "$1" >&2
  exit 1
}

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/html/Alfresco}"
PHP_BIN="${PHP_BIN:-php8.4}"
COMPOSER_BIN="${COMPOSER_BIN:-/usr/local/bin/composer}"

echo "Checking deployment directory: $DEPLOY_DIR"
cd "$DEPLOY_DIR" || fail "Deployment directory does not exist or is inaccessible: $DEPLOY_DIR"
test "$(pwd -P)" = "$(git rev-parse --show-toplevel)" || fail 'DEPLOY_DIR must be the root of the Alfresco Git checkout; check ownership if Git reports dubious ownership.'
REMOTE_URL="$(git remote get-url origin)"
case "$REMOTE_URL" in
  https://github.com/yongyutTG/Alfresco.git|git@github.com:yongyutTG/Alfresco.git) ;;
  *) fail 'Unexpected origin URL. Expected the HTTPS or SSH clone URL for yongyutTG/Alfresco.git.' ;;
esac
# Do not overwrite tracked server-side edits.
TRACKED_CHANGES="$(git status --porcelain --untracked-files=no)"
if [[ -n "$TRACKED_CHANGES" ]]; then
  printf '%s\n' "$TRACKED_CHANGES"
  fail 'Tracked files have local changes on the server. Review and preserve them before deploying.'
fi
echo 'Checking PHP, Composer, environment and service prerequisites'
"$PHP_BIN" -r 'if (PHP_VERSION_ID < 80400 || PHP_VERSION_ID >= 80500) { fwrite(STDERR, "PHP 8.4.x is required for this deployment\n"); exit(1); } foreach (["intl", "mbstring", "fileinfo"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Missing extension: $ext\n"); exit(1); } }'
test -f "$COMPOSER_BIN" || fail "Composer file not found: $COMPOSER_BIN"
test -f .env || fail "Missing server environment file: $DEPLOY_DIR/.env"
test -w writable || fail "Runner cannot write to $DEPLOY_DIR/writable"
systemctl cat php8.4-fpm >/dev/null
sudo -n nginx -t

echo 'Fetching main'
git fetch origin main
# Deploy exactly the revision that passed CI; manual runs use fetched main.
DEPLOY_REVISION="${GITHUB_SHA:-origin/main}"
git merge-base --is-ancestor "$DEPLOY_REVISION" origin/main
# Skip an older queued run if a newer main revision is already available.
if [[ -n "${GITHUB_SHA:-}" && "$(git rev-parse "$DEPLOY_REVISION")" != "$(git rev-parse origin/main)" ]]; then
  echo 'Skipping superseded deployment.'
  exit 0
fi
echo "Deploying revision: $DEPLOY_REVISION"
git reset --hard "$DEPLOY_REVISION"
"$PHP_BIN" "$COMPOSER_BIN" install --no-dev --prefer-dist --no-interaction --optimize-autoloader
"$PHP_BIN" "$COMPOSER_BIN" check-platform-reqs --no-dev

sudo -n systemctl restart php8.4-fpm
sudo -n systemctl reload nginx
echo "Deployment completed: $(git rev-parse HEAD)"
