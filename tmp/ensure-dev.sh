#!/bin/bash
# tmp/ensure-dev.sh — probe :3000, relaunch detached if the sandbox reaped it.
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 http://localhost:3000/)
if [ "$code" != "200" ]; then
  cd /home/z/my-project
  setsid nohup bun run dev >> dev.log 2>&1 < /dev/null &
  for i in $(seq 1 40); do
    sleep 3
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:3000/)
    [ "$code" = "200" ] && break
  done
fi
echo "dev: HTTP $code"
