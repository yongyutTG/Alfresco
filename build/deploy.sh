#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/html/Alfresco}"
PHP_BIN="${PHP_BIN:-php8.4}"
COMPOSER_BIN="${COMPOSER_BIN:-/usr/local/bin/composer}"

cd "$DEPLOY_DIR"
test "$(pwd -P)" = "$(git rev-parse --show-toplevel)"
test "$(git remote get-url origin)" = 'https://github.com/yongyutTG/Alfresco.git' ||
  test "$(git remote get-url origin)" = 'git@github.com:yongyutTG/Alfresco.git'
# Do not overwrite tracked server-side edits.
test -z "$(git status --porcelain --untracked-files=no)"
"$PHP_BIN" -r 'if (PHP_VERSION_ID < 80400 || PHP_VERSION_ID >= 80500) { fwrite(STDERR, "PHP 8.4.x is required for this deployment\n"); exit(1); } foreach (["intl", "mbstring", "fileinfo"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Missing extension: $ext\n"); exit(1); } }'
test -f "$COMPOSER_BIN"
test -f .env
test -w writable
systemctl cat php8.4-fpm >/dev/null
sudo -n nginx -t

git fetch origin main
# Deploy exactly the revision that passed CI; manual runs use fetched main.
DEPLOY_REVISION="${GITHUB_SHA:-origin/main}"
git merge-base --is-ancestor "$DEPLOY_REVISION" origin/main
# Skip an older queued run if a newer main revision is already available.
if [[ -n "${GITHUB_SHA:-}" && "$(git rev-parse "$DEPLOY_REVISION")" != "$(git rev-parse origin/main)" ]]; then
  echo 'Skipping superseded deployment.'
  exit 0
fi
git reset --hard "$DEPLOY_REVISION"
"$PHP_BIN" "$COMPOSER_BIN" install --no-dev --prefer-dist --no-interaction --optimize-autoloader
"$PHP_BIN" "$COMPOSER_BIN" check-platform-reqs --no-dev

sudo -n systemctl restart php8.4-fpm
sudo -n systemctl reload nginx
echo "Deployment completed: $(git rev-parse HEAD)"
