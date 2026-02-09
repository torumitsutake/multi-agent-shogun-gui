#!/bin/bash
# SayTask通知 — ntfy.sh経由でスマホにプッシュ通知
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SETTINGS="$SCRIPT_DIR/config/settings.yaml"
if [ ! -f "$SETTINGS" ]; then
  echo "ERROR: settings.yaml not found: $SETTINGS" >&2
  exit 1
fi
TOPIC=$(grep 'ntfy_topic:' "$SETTINGS" | awk '{print $2}' | tr -d '"')
if [ -z "$TOPIC" ]; then
  echo "ERROR: ntfy_topic not configured in $SETTINGS" >&2
  exit 1
fi
curl -s -H "Tags: outbound" -d "$1" "https://ntfy.sh/$TOPIC" > /dev/null
