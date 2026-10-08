#!/usr/bin/env bash
# =============================================================================
# DeckForge × TestSprite — one-command cloud test suite
#
# Usage:
#   TESTSPRITE_API_KEY=sk-user-... bash testsprite/run-suite.sh
#   TESTSPRITE_API_KEY=sk-user-... bash testsprite/run-suite.sh --timeout 1200
#
# What it does:
#   1. Verifies the app is reachable on localhost:3000 (dev server)
#   2. Configures the CLI with your key (idempotent, no agent-skill writes)
#   3. Finds or creates the "DeckForge" frontend project (loopback → auto tunnel)
#   4. Renders the 13 validated test plans with the real projectId
#   5. Lints them, then create-batch + run + wait (paced to 3 concurrent runs
#      so the app's AI rate limits are respected)
#   6. Prints the run summary and the triage commands for any failures
#
# Cost note (TestSprite free tier): each frontend run bills 0.5 credits,
# so a full suite pass spends ~6.5 credits. Check `testsprite usage` first.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.." # project root

PORT="${PORT:-3000}"
PROJECT_NAME="DeckForge"
BUILD_DIR="testsprite/.build"
PLANS_DIR="$BUILD_DIR/plans"
TIMEOUT="900"
if [[ "${1:-}" == "--timeout" && -n "${2:-}" ]]; then TIMEOUT="$2"; fi

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }

# --- 0. Precondition: API key -------------------------------------------------
if [[ -z "${TESTSPRITE_API_KEY:-}" ]]; then
  echo "ERROR: TESTSPRITE_API_KEY is not set."
  echo "Create one at https://www.testsprite.com/dashboard/settings/apikey then run:"
  echo "  TESTSPRITE_API_KEY=sk-user-... bash testsprite/run-suite.sh"
  exit 2
fi

# --- 1. App reachable? --------------------------------------------------------
log "Checking app on http://localhost:$PORT ..."
if ! curl -fsS -o /dev/null "http://localhost:$PORT/"; then
  echo "ERROR: app is not reachable on :$PORT. Start it first:  bun run dev"
  exit 3
fi
echo "OK — app is up."

# --- 2. Auth ------------------------------------------------------------------
log "Configuring TestSprite credentials (idempotent)..."
testsprite setup --from-env --no-agent --yes >/dev/null
testsprite auth status || true
testsprite usage || true # print credit balance before spending

# --- 3. Find or create the project --------------------------------------------
log "Looking for the '$PROJECT_NAME' project..."
PROJECT_ID="$(testsprite project list --output json 2>/dev/null | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    try {
      const j=JSON.parse(s.replace(/^\n?[^{]*/,""));
      const items=j.items||j.projects||j.data||[];
      const hit=items.find(p=>p&&(p.name===process.env.PN));
      console.log(hit?hit.id:"");
    } catch { console.log(""); }
  });' PN="$PROJECT_NAME")"

if [[ -z "$PROJECT_ID" ]]; then
  log "Creating frontend project '$PROJECT_NAME' (loopback :$PORT, tunnel opens automatically on runs)..."
  PROJECT_ID="$(testsprite project create --type frontend --name "$PROJECT_NAME" --local "$PORT" --output json | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const j=JSON.parse(s.replace(/^\n?[^{]*/,"")); console.log(j.id||j.projectId||""); }
      catch { console.log(""); }
    });')"
fi
[[ -n "$PROJECT_ID" ]] || { echo "ERROR: could not resolve a project id."; exit 4; }
log "Project: $PROJECT_ID"

# --- 4. Render plans with the real projectId ----------------------------------
log "Rendering plans into $PLANS_DIR ..."
mkdir -p "$PLANS_DIR"
rm -f "$PLANS_DIR"/*.json
for f in testsprite/plans/*.json; do
  sed "s/__PROJECT_ID__/$PROJECT_ID/g" "$f" > "$PLANS_DIR/$(basename "$f")"
done

log "Linting rendered plans..."
testsprite test lint --plan-from-dir "$PLANS_DIR"

# --- 5. Create + run + wait ----------------------------------------------------
log "Creating and running the suite (max 3 concurrent runs, per-run timeout ${TIMEOUT}s)..."
# Concurrency is intentionally low: several tests drive the app's AI endpoints,
# which are rate-limited per client — flooding them would cause flaky 429s.
set +e
testsprite test create-batch \
  --plan-from-dir "$PLANS_DIR" \
  --run --wait \
  --max-concurrency 3 \
  --timeout "$TIMEOUT" \
  --output json | tee "$BUILD_DIR/last-run.json"
SUITE_EXIT=$?
set -e

# --- 6. Summary + triage pointers ---------------------------------------------
log "Suite finished (exit $SUITE_EXIT). Results saved to $BUILD_DIR/last-run.json"
cat <<'EOF'

Triage a failure (pulls one self-consistent bundle: video, screenshots, DOM, log):
  testsprite test failure get <test_id> --out ./.testsprite/failure
Re-run a single fixed test:
  testsprite test rerun <test_id> --wait --output json
List all tests in the project:
  testsprite test list --project <project_id>
EOF
exit $SUITE_EXIT
