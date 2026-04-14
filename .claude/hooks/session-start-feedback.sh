#!/usr/bin/env bash
# SessionStart hook: fetch unresolved user feedback from the Convex production database
# and surface it to the Claude Code session.
#
# Hook contract:
#   exit 0  => success, stdout is shown to the model as context
#   stderr  => shown to the user in the UI

FEEDBACK_URL="https://cheerful-canary-927.convex.site/api/feedback"

# Fetch feedback with a short timeout so we don't block session start
response=$(curl -s --max-time 5 "$FEEDBACK_URL" 2>/dev/null)

# If curl failed or returned empty, exit silently
if [[ -z "$response" ]]; then
  exit 0
fi

# Filter to unresolved feedback only (resolved is absent or false)
unresolved=$(echo "$response" | jq '[.[] | select(.resolved != true)]' 2>/dev/null)

# If jq failed, exit silently
if [[ $? -ne 0 || -z "$unresolved" ]]; then
  exit 0
fi

count=$(echo "$unresolved" | jq 'length')

# If no unresolved feedback, exit cleanly
if [[ "$count" == "0" || "$count" == "null" ]]; then
  exit 0
fi

# Format the feedback for the model's context (stdout goes to the model)
echo "=== UNRESOLVED USER FEEDBACK ($count items) ==="
echo ""
echo "$unresolved" | jq -r '.[] | "- [" + ._id + "] " + .text + " (submitted: " + (.createdAt / 1000 | strftime("%Y-%m-%d %H:%M UTC")) + ")"'
echo ""
echo "Review this feedback and address any items relevant to your current task."
echo "After addressing feedback, resolve it with WebFetch GET to https://cheerful-canary-927.convex.site/api/feedback/resolve?id=<_id>"

exit 0
