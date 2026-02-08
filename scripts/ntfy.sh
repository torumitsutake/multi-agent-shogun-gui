#!/bin/bash
# SayTask通知 — ntfy.sh経由でスマホにプッシュ通知
SETTINGS="/mnt/c/tools/multi-agent-shogun/config/settings.yaml"
TOPIC=$(grep 'ntfy_topic:' "$SETTINGS" | awk '{print $2}' | tr -d '"')
if [ -z "$TOPIC" ]; then
  echo "ntfy_topic not configured in settings.yaml"
  exit 1
fi
curl -s -H "Tags: outbound" -d "$1" "https://ntfy.sh/$TOPIC" > /dev/null
