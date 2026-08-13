#!/bin/bash
# PreToolUse guard: shipping this project is CI/CD only.
#
# `git push` to main triggers .eas/workflows/release-native.yml, which builds AND
# submits. Running `eas submit` (or a --local build) by hand bypasses that, and
# it hides pipeline breakage: the iOS submit job was silently failing on the free
# plan for three builds while every build job still reported green. If a human
# submits around it, nobody finds out.
#
# Reads the PreToolUse JSON payload on stdin and denies the call by printing a
# permissionDecision. Read-only subcommands (build:list, build:view) and the
# sanctioned manual trigger (workflow:run) are deliberately allowed.

payload=$(cat)

cmd=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
if d.get("tool_name") != "Bash":
    sys.exit(0)
print(d.get("tool_input", {}).get("command", ""))
' 2>/dev/null)

[ -z "$cmd" ] && exit 0

deny() {
  python3 -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": sys.argv[1],
}}))' "$1"
  exit 0
}

# Normalise so "npx  eas-cli   submit" matches the same as "eas submit".
norm=$(printf '%s' "$cmd" | tr '\n' ' ' | tr -s ' ')

CICD_MSG='Shipping crapple-maps is CI/CD ONLY — Austin has said this repeatedly.

  git push origin main

triggers .eas/workflows/release-native.yml, which BUILDS AND SUBMITS both
platforms. To force a run when no native file changed:

  npx eas-cli workflow:run .eas/workflows/release-native.yml

Do not submit or build by hand. Submitting around the pipeline also hides
pipeline breakage — the iOS submit job failed silently on the free plan for
three builds while build_ios still went green. See AGENTS.md.'

# eas submit / eas-cli submit — the store submission the pipeline owns.
if printf '%s' "$norm" | grep -Eq '\beas(-cli)?[[:space:]]+submit\b'; then
  deny "BLOCKED: manual \`eas submit\`.

$CICD_MSG"
fi

# Local builds — the point of the pipeline is that a push ships.
if printf '%s' "$norm" | grep -Eq '\beas(-cli)?[[:space:]]+build\b' \
   && printf '%s' "$norm" | grep -Eq '(^|[[:space:]])--local([[:space:]]|$)'; then
  deny "BLOCKED: local EAS build (\`--local\`).

$CICD_MSG"
fi

exit 0
