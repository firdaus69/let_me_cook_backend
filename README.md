# Let Me Cook API

Backend for the Let Me Cook Flutter app: Node.js + TypeScript, Fastify, Prisma and PostgreSQL.

## First-time setup

```bash
brew install postgresql@16
brew services start postgresql@16
createdb let_me_cook

npm install
cp .env.example .env        # then set JWT_SECRET (see the comment in the file)
npm run db:migrate          # creates the tables
npm run db:seed             # loads the sample recipes
npm run dev                 # http://localhost:3000/health
```

From the Android emulator the server is at `http://10.0.2.2:3000`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload |
| `npm test` | Run tests (database tests run only when `DATABASE_URL` is set) |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run db:migrate` | Apply schema changes in `prisma/schema.prisma` (creates a migration) |
| `npm run db:seed` | Load / refresh sample data (safe to re-run) |
| `npm run db:reset` | Drop everything, re-migrate and re-seed |
| `npm run db:studio` | Browse the database in your browser |

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | | `{ ok, db }` |
| GET | `/countries` | | |
| GET | `/ingredients` | | Grouped by category |
| GET | `/recipes/suggested?country=MY&limit=5` | | "Suggested for you" |
| GET | `/recipes/popular?country=MY&limit=5` | | Most cooked, then editorial score |
| GET | `/recipes/:id` | | Includes `steps` |
| POST | `/recipes/match` | | Body `{ ingredients: string[], maxMissing?: 0-3, country? }` → `{ ready, almost, unknownIngredients }` |
| POST | `/auth/register` | | Body `{ email, password, countryCode? }` → `{ token, user }` |
| POST | `/auth/login` | | Body `{ email, password }` → `{ token, user }` |
| GET | `/me` | ✓ | |
| GET | `/me/saved` | ✓ | |
| PUT / DELETE | `/me/saved/:recipeId` | ✓ | Idempotent |
| POST | `/recipes/:id/cooked` | ✓ | Feeds the Popular ranking |

Authenticated requests send `Authorization: Bearer <token>`. Tokens last 7 days.
Errors look like `{ "error": "...", "details"?: [{ "path", "message" }] }`.

## Layout

```
prisma/schema.prisma   tables
prisma/seed.ts         sample data (same as the app's sample_data.dart)
src/server.ts          starts the server
src/app.ts             builds the Fastify app (used by tests too)
src/routes/            one file per area
src/lib/matcher.ts     fridge matching rules
```

## Notes

- Node 22 LTS or newer is recommended. On Node 21 the tests use real HTTP
  instead of Fastify's `inject()`, and Vitest/Prisma are held at older versions.
- Before going live: restrict CORS in `src/app.ts`, use a strong `JWT_SECRET`,
  and run `npm run db:deploy` (not `db:migrate`) on the server.
