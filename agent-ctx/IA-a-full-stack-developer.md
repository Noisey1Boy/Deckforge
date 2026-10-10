# Task IA-a — Auth backend + per-user deck scoping (work record)

Agent: full-stack-developer (auth backend)
Status: COMPLETE — all routes implemented, db migrated, lint clean, end-to-end curl verification passed.

## Files created
- `src/lib/auth.ts` — scrypt hashing (16-byte salt, `salt:hexhash`), timing-safe verify, `SESSION_COOKIE='df_session'`, 30-day TTL; `createSession` (32-byte hex token stored AS the Session row id + httpOnly/sameSite-lax cookie), `getSessionUser` (expired rows deleted eagerly; returns `{id,name,email,createdAt}` — never passwordHash), `destroySession`.
- `src/app/api/auth/signup/route.ts` — POST; name 1..60, email regex + lowercase, pw ≥ 8; 409 `An account with this email already exists`; creates user + session; returns `{user:{id,name,email,createdAt}}`.
- `src/app/api/auth/login/route.ts` — POST; lowercase email lookup; 401 `Incorrect email or password`; session cookie on success.
- `src/app/api/auth/logout/route.ts` — POST; destroys session row + cookie; `{ok:true}`.
- `src/app/api/auth/me/route.ts` — GET; `{user:null}` or `{user:{id,name,email,createdAt}}`.
- `src/app/api/auth/password/route.ts` — POST; requires session (401); verifies `current` (400 `Current password is incorrect`), `next` ≥ 8; rotates hash; `{ok:true}`.

## Files changed
- `prisma/schema.prisma` — added `User`, `Session` (id = raw token); `Deck` + `HtmlDeck` gained `userId String?` + optional cascade relation. `bun run db:push` OK (early, before route code), Prisma Client regenerated, existing rows kept as guest-owned (userId NULL).
- `src/app/api/decks/route.ts` — GET: `where: { userId: sessionUser?.id ?? null }`; POST: stamps `userId`.
- `src/app/api/decks/[id]/route.ts` — GET/PUT/DELETE: ownership check (`row.userId && row.userId !== sessionUser?.id` → 404 `Deck not found`); PUT upsert-create stamps userId; missing-row behavior preserved (same 500s as before).
- `src/app/api/htmldecks/route.ts` — GET where-clause + POST stamps userId.
- `src/app/api/htmldecks/[id]/route.ts` + `[id]/raw/route.ts` — same ownership checks; raw returns 404 JSON for foreign owned decks; guest-owned rows stay public.
- `src/app/api/htmlgen/slides/route.ts` (:190) + `scratch/route.ts` (:184) — capture `ownerId` BEFORE the ReadableStream (cookies() not usable inside the stream) and stamp it on `db.htmlDeck.create`.
- `worklog.md` — appended the IA-a section (template-compliant).

## db:push result
`prisma db push` → "Your database is now in sync with your Prisma schema. Done in 15ms" + client generated (v6.19.2). No data loss.

## Curl verification transcript (cookie jar, :3000) — all passed
| # | Call | Result |
|---|------|--------|
| 1 | POST /api/auth/signup | 200 `{user:{id,name,email,createdAt}}` |
| 2 | duplicate signup (case-diff email) | 409 exact message |
| 3 | GET /api/auth/me (authed) | 200 user |
| 4 | POST /api/decks (authed) | 201 `{id}` |
| 5 | GET /api/decks (authed) | only the new deck (legacy unowned hidden) |
| 6 | POST /api/auth/logout | 200 `{ok:true}` |
| 7 | GET /api/auth/me (after logout) | 200 `{user:null}` |
| 8 | POST /api/auth/login | 200 user |
| 9 | GET /api/htmldecks (authed) | 200 `{decks:[]}` |
| 10 | guest GET /api/decks | 8 legacy decks; owned deck → 404 for guests |
| 11 | guest GET /api/htmldecks | 3 legacy decks; authed GET of unowned id → 200 |
| 12 | password change / old-pw login / new-pw login / wrong current / unauthenticated | `{ok:true}` / 401 / 200 / 400 exact msg / 401 |

dev.log after restart: zero errors; every route compiled and served.

## Ops incident (resolved)
The pre-existing dev server held the STALE pre-migration Prisma Client (`db.user` undefined, `userId` unknown arg → 500s). Restarting the dev server fixed it. NOTE: the sandbox reaps detached dev servers between Bash tool calls; the platform's own supervised launch is what persists. If the preview is down, the platform must relaunch `bun run dev` — all code on disk compiles clean.

## For IA-b (frontend)
- Drive account UI off `GET /api/auth/me` (`{user:null}` for guests). Cookie is httpOnly — never read it client-side.
- Error strings to surface verbatim: `An account with this email already exists` (409), `Incorrect email or password` (401), `Current password is incorrect` (400). 401 is returned ONLY by /api/auth/password when unauthenticated.
- Foreign owned decks masquerade as 404 `Deck not found` on all [id] routes (decks, htmldecks, raw).
- Response shapes of every deck/htmldeck endpoint are UNCHANGED — existing client parsers keep working.
- Test account: ia-a-test@deckforge.dev / `newersecret456` (after the password-change test) + one owned studio deck "IA-a Auth Verification Deck". Legacy decks are unowned → guests see them; signed-in users do NOT (per spec).
