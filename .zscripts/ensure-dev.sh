#!/bin/bash
# ensure-dev.sh — idempotent dev-server guard for QA waves.
# The sandbox reaps long-running background processes between Bash calls, so
# each QA wave starts by making sure :3000 is listening.
if ! curl -s -o /dev/null --connect-timeout 2 http://localhost:3000/; then
  cd /home/z/my-project || exit 1
  setsid nohup bun run dev >> dev.log 2>&1 < /dev/null &
  for i in $(seq 1 120); do
    if curl -s -o /dev/null --connect-timeout 2 http://localhost:3000/; then
      break
    fi
    sleep 1
  done
fi
curl -s -o /dev/null -w "ensure-dev → :3000 = %{http_code}\n" http://localhost:3000/
