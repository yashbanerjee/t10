# United Tigers REST API

Base path: `/api/v1`. Every response uses `{ "success": boolean, "data": ..., "message": "..." }`; validation errors include an `errors` array. Admin routes require the `ut_admin` HTTP-only session cookie.

## Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/players` | Active squad ordered by display order |
| GET | `/players/:slug` | Player profile |
| GET | `/matches` | Confirmed, non-demo fixtures |
| GET | `/news` | Published newsroom items |
| GET | `/updates` | Published team updates |
| GET | `/stats/players?season=2026` | Scorecard-derived batting, bowling and fielding totals |
| POST | `/contact` | Validate and save a contact enquiry |
| POST | `/auth/login` | Sign in; eight failed attempts per IP per rolling window are throttled |
| GET | `/auth/me` | Current administrator session |
| POST | `/auth/logout` | Clear the administrator session |

## Administrator endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard` | CMS overview counts and next fixture |
| GET/POST | `/admin/players` | List/create players |
| PATCH/DELETE | `/admin/players/:id` | Update or deactivate a player |
| GET/POST | `/admin/matches` | List/create fixtures and matches |
| PATCH/DELETE | `/admin/matches/:id` | Update status/result or cancel a fixture |
| GET/POST | `/admin/news` | List/create news articles |
| PATCH/DELETE | `/admin/news/:id` | Edit or return a story to draft |
| GET/POST | `/admin/updates` | List/create daily team updates |
| PATCH/DELETE | `/admin/updates/:id` | Edit or unpublish an update |
| GET/POST | `/admin/gallery` | List/create gallery records |
| DELETE | `/admin/gallery/:id` | Unpublish a gallery item |
| GET/POST | `/admin/sponsors` | List/create partners |
| DELETE | `/admin/sponsors/:id` | Unpublish a partner |
| GET/PATCH | `/admin/contacts/:id` | Read or mark a contact message as read |
| GET | `/admin/audit` | View the latest audit records |
| GET/POST | `/admin/settings` | Read/upsert site settings |
| GET/POST | `/admin/users` | Super-admin list/create for CMS accounts |
| PATCH/DELETE | `/admin/users/:id` | Super-admin update/deactivate; protects the last active super-admin |
| GET | `/admin/roles` | View the built-in role permission matrix (super-admin only) |
| GET/PUT | `/admin/matches/:id/scorecard` | Read or save scorecard lines, match status, result and live match state |
| POST | `/admin/media/upload` | Upload validated media to configured S3-compatible storage |

Permissions are enforced by built-in role in the server route handlers. Super-admins can assign roles to users; role grants are fixed in application policy and visible in the CMS matrix. All inputs are validated with Zod. The live score model is stored on `Match.liveState`; the website polls the match endpoint and can later switch to SSE/WebSockets without changing the page model.

