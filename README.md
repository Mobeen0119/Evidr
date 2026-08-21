# Sleuth

Put in a URL, a document, or a plain description of a situation. It fetches and reads the source, breaks it into individual factual claims, cross-checks them against each other for contradictions, scores how AI-generated the writing looks, checks the domain and page for trust signals, and — for consumer/legal situations like a lost parcel or delayed shipment — surfaces a concrete evidence checklist and your likely rights.

Runs entirely on free, local analysis by default. No paid API key required.

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `SESSION_SECRET` to a random string at least 32 characters long. Everything else can stay as-is for local use.

```bash
npm run dev
```

Visit `http://localhost:3000`, register an account, and start investigating.

## Deploying

This is a standard Next.js app. Deploy it anywhere that runs Node.js (Vercel, Railway, Render, a VPS, etc.).

Required environment variable:

- `SESSION_SECRET` — random string, 32+ characters, used to sign login sessions.

Optional:

- `DATABASE_URL` — defaults to `file:./data/app.db`, a local SQLite file. Works fine for a single-instance deployment. For a multi-instance production deployment, point this at a hosted SQLite service (e.g. Turso/LibSQL) or migrate the schema in `lib/database/schema.ts` to Postgres.
- `ANTHROPIC_API_KEY` — if set, claim verification additionally runs a real web-search-backed check through the Anthropic API and attaches live citations. Without it, the app still works fully using its local heuristics engine.
- `ANTHROPIC_MODEL` — defaults to `claude-sonnet-4-5`, only used if `ANTHROPIC_API_KEY` is set.

On most platforms, set these as environment variables in the hosting dashboard rather than committing `.env`.

The SQLite database file is created automatically on first run at the path in `DATABASE_URL`. Make sure that path is on persistent storage on your host — some platforms wipe the filesystem between deploys, in which case point `DATABASE_URL` at a mounted volume.

## What it checks, without any paid API

- Domain reputation — flags raw IPs, punycode/homograph domains, high-abuse free TLDs, URL shorteners, brand-impersonation patterns, and recognizes major known institutions.
- Page transparency — HTTPS, privacy policy, about/contact info, byline, publish date, and whether the page cites outside sources.
- Internal consistency — cross-checks numbers and claims within the same document for contradictions.
- AI-slop score — a 0-100 composite from writing-pattern signals (formulaic phrasing, repetitive sentence structure, low lexical diversity, transition-word density). This is a heuristic estimate, not a forensic detector, and the app is explicit about that in its own output.
- Scenario detection — recognizes situations like a lost/delayed parcel, airline baggage loss, or a refund dispute, and returns a specific evidence checklist and suggested next steps (e.g. carrier liability policy, PIR claim deadline, chargeback rights).

## Architecture notes

- Auth: bcrypt password hashing plus a signed JWT session cookie, enforced by middleware.ts on every route except /login, /register, and the auth API endpoints.
- Database: SQLite via better-sqlite3 and Drizzle ORM (lib/database/). Each case is stored as a JSON payload scoped to the owning user, giving atomic writes and per-user isolation without a heavier relational rewrite.
- Rate limiting: DB-backed sliding window (lib/rate-limit.ts), applied to login, registration, and the investigation endpoint.
- Pipeline: lib/investigation/pipeline.ts orchestrates ingestion, claim extraction, evidence building, contradiction checking, domain and page verification, AI-slop scoring, scenario detection, and optionally live AI verification, streaming progress as newline-delimited JSON to the UI.

## A note on the Gemini model name

Google's free-tier model lineup changes fairly often (they retired Gemini 2.0 Flash in early 2026 and cut free quotas once already in December 2025). The app defaults to `gemini-2.5-flash` via `GEMINI_MODEL` in `.env`, but before relying on this, check the current free-tier row yourself at https://ai.google.dev/gemini-api/docs/pricing and update `GEMINI_MODEL` if the name has changed.
