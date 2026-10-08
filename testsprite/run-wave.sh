#!/usr/bin/env bash
# Run a wave of TestSprite tests in parallel, in the FOREGROUND (sandbox kills
# backgrounded long-running processes). Usage: bash run-wave.sh <testId>...
set -u
cd /home/z/my-project
mkdir -p testsprite/.build/runs
for id in "$@"; do
  echo "[wave] dispatching $id"
  testsprite test run "$id" --wait --timeout 500 --output json \
    > "testsprite/.build/runs/$id.json" 2>&1 &
done
wait
echo "[wave] all runs reached terminal state"
node -e '
const fs=require("fs");
for(const id of process.argv.slice(1)){
  const raw=fs.readFileSync(`testsprite/.build/runs/${id}.json`,"utf8");
  const start=raw.split("\n").findIndex(l=>l.trim().startsWith("{"));
  let out=`${id}  PARSE-FAIL`;
  if(start>=0){
    try{
      const j=JSON.parse(raw.split("\n").slice(start).join("\n"));
      out=`${id}  ${String(j.status||"?").toUpperCase()}  runId=${j.id||j.runId||"?"}`;
    }catch{ /* keep parse-fail */ }
  }
  console.log(out);
}
' "$@"
