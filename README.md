# United Tigers — Official Website & CMS

A responsive Next.js website and protected admin CMS for the United Tigers T10 franchise. Public content is rendered server-side from PostgreSQL through Prisma and exposed through a versioned REST API. The CMS supports role-checked content workflows, scorecard entry, derived season/career statistics, audit events, contact messages and S3-compatible media uploads.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL with Prisma ORM
- Zod request validation, bcrypt password hashing and signed HTTP-only sessions
- S3-compatible storage via AWS SDK
- Framer Motion, Lucide icons and Tailwind CSS foundations

The original workspace contained no application or official brand files. The current visual tokens live in `src/config/theme.ts`; replace them and the text-only team mark when the official asset kit is available. The generated homepage stadium artwork is a generic, unbranded image.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL 15 or newer
- npm 10 or newer

## Local setup

1. Create a PostgreSQL database and copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

2. In `.env`, set only what the app needs before anyone can sign in:

   - `DATABASE_URL` — PostgreSQL connection
   - `JWT_SECRET` — at least 32 random characters, used to sign the admin session
   - `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 8 characters — used once by the seed to create the first super admin

   Site URL, live-score polling, storage and homepage copy are saved later in **Admin → Site settings**. Keep real secrets out of source control.

3. Install, generate Prisma Client, create the database schema and seed development records:

   ```powershell
   npm install
   npm run db:generate
   npm run db:migrate
   npm run seed
   ```

4. Start the site and API:

   ```powershell
   npm run dev
   ```

   Visit `http://localhost:3000` for the public website and `/admin/login` for the CMS. The administrator account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` during seeding.

If PostgreSQL is not configured, the public pages have a read-only visual fallback and development has a demo login (`admin@unitedtigers.ae` / `tigers-demo`). That login is disabled in production and cannot save CMS content.

## Build and checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

`npm test` covers derived batting/bowling calculations, season/career aggregation behavior, role permissions and request validation. Database-backed CRUD and end-to-end checks require a running PostgreSQL instance and are not run as part of the unit test suite.

## Database and sample content

The initial PostgreSQL migration is under `prisma/migrations`. `prisma/schema.prisma` models teams, seasons, tournaments, venues, players, staff, matches, innings, scorecard performances, news, daily updates, media, gallery, partners, records, points, contact submissions, admin users/sessions, site settings and audit logs.

`npm run seed` adds the 2026 season, the nine player names listed in the supplied brief, a local super-admin, and clearly tagged sample records. Player roles and statistics are left blank until an administrator enters verified information. Demo fixtures, scores, sponsors, records and articles are excluded from public database queries. The sample news/update fallback on a fresh visual preview is marked `SAMPLE CONTENT` in the UI.

Player career statistics are aggregated from historical innings. Batting average, strike rate, bowling economy, bowling average and bowling strike rate are calculated from scorecard data; cricket overs use ball notation (for example, `4.3` means four overs and three balls).

Player report cards display a small, transparent club index derived from verified scorecard totals. The index is clearly labeled as an internal indicator, is omitted until recorded performances exist, and is not presented as an official league rating. Points standings use completed match innings and results when both participating teams have been recorded, with manually curated non-demo standings as a fallback.

## CMS

`/admin` is a role-protected CMS. Available roles are `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `STATISTICS_MANAGER` and `CONTENT_MANAGER`. Route handlers enforce permissions independently of the UI. The site includes:

- Player profiles, icon/captain flags, staff profiles and display ordering
- Fixtures, live status, match scorecards and batting/bowling/fielding entry
- Current-season and career player statistics calculated from scorecards
- News drafts, publication controls, SEO fields and daily updates
- Gallery and partner management
- Contact inbox, homepage settings and audit history
- Super-admin account creation/deactivation and the built-in role-permission matrix
- Safe Markdown authoring for stories and daily updates, plus match-day live score state controls

Media upload accepts JPG, PNG, WebP and MP4 up to 25 MB. In **Admin → Site settings**, set the S3-compatible endpoint, bucket, region, access key, secret key, and (when the object endpoint is not publicly readable) the public file URL. Leave the keys blank on a later save to keep the current secrets. Uploaded object URLs are stored in PostgreSQL; binaries are not.

## REST API

The API is rooted at `/api/v1`, uses a consistent JSON envelope and is documented in [`docs/API.md`](docs/API.md). Public routes expose players, matches, news, updates and derived player stats. Admin routes require an HTTP-only session cookie, check role permissions, validate request bodies, and add audit entries for important changes. Admin mutations also validate the request origin.

Live pages poll the match endpoint at the interval saved in **Admin → Site settings** (5–60 seconds; defaults to 15 seconds). `Match.liveState` stores current innings, score, overs, batters, bowler, partnership and run rates so polling can later be replaced with SSE or WebSockets.

## Production configuration

- Use a managed PostgreSQL service, set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the deployment environment, and run `npm run db:deploy` during deployment.
- Set the canonical HTTPS origin in **Admin → Site settings**. That value is used for metadata and the sitemap.
- Configure public S3/R2-compatible storage in **Admin → Site settings**, including the public file URL used for image delivery.
- Terminate HTTPS at the deployment edge; production responses add security headers and secure cookies.
- Put distributed login throttling and request limits at the edge when deploying multiple application instances. The in-process login limiter is intended for a single-instance deployment.

