#!/usr/bin/env bash
# Build the Expo web export for static hosting. This is Vercel's Build Command
# (set in vercel.json). It runs on every push — no manual deploys.
# EXPO_PUBLIC_* keys come from Vercel's project env in CI; from .env locally.
set -e
[ -f .env ] && { set -a; source .env; set +a; }
npx expo export --platform web
python3 scripts/postbuild.py

# Ship the same JS to the native app over-the-air so one push updates web AND
# native together. Runs only on production deploys with an EXPO_TOKEN present
# (set EXPO_TOKEN in Vercel's project env). Never fails the web deploy.
if [ -n "$EXPO_TOKEN" ] && [ "$VERCEL_ENV" = "production" ]; then
  echo "build-web: pushing native OTA (eas update --branch production)…"
  npx eas-cli update --branch production --non-interactive \
    --message "web deploy ${VERCEL_GIT_COMMIT_SHA:-ci}" \
    || echo "build-web: eas update failed (non-fatal, web deploy continues)"
fi
