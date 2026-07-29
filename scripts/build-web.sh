#!/usr/bin/env bash
# Build the Expo web export for static hosting. This is Vercel's Build Command
# (set in vercel.json). It runs on every push — no manual deploys.
# EXPO_PUBLIC_* keys come from Vercel's project env in CI; from .env locally.
#
# Native OTA is NOT shipped from here — EAS Workflows owns it
# (.eas/workflows/publish-ota.yml, path-filtered to app code) so web-only
# deploys don't push pointless updates to native users.
set -e
[ -f .env ] && { set -a; source .env; set +a; }
npx expo export --platform web
python3 scripts/postbuild.py
