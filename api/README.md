# Betta Track API

NestJS API for fish records stored in Supabase. Each fish QR encodes the
fish record URL; scanning it opens the public, read-only lineage summary at
`GET /api/fish/qr/:id`.

## Setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `supabase/migrations/202610190001_initial_schema.sql` from the repository root.
3. Copy `api/env.example` to `api/.env` and set the project URL, server-only secret key, and a long random API access token.
4. From `api/`, run `npm install` and `npm run start:dev`.
5. Check `http://localhost:4000/api/health/database` to verify the connection.

Protected endpoints require `Authorization: Bearer <API_ACCESS_TOKEN>`:

- `GET /api/fish` lists fish.
- `POST /api/fish` creates a fish.

The fish QR lookup endpoint does not require the management API token and only
returns the fish's public label details: name, code, line, age, and parents.

Never put `SUPABASE_SECRET_KEY` or `API_ACCESS_TOKEN` in a `NEXT_PUBLIC_*`
variable or browser code. Add user authentication before deploying the
management endpoints publicly.