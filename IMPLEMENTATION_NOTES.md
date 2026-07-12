# CareerOS Private Single-User Mode

CareerOS now runs as a private single-user app with a lightweight access-key cookie. It does not use a CareerOS login page, Supabase Auth callback, email allowlist, browser session checks, or Vercel SSO as the normal access path.

Implemented:

- Removed app-level Supabase Auth routes and login/logout UI.
- Added `/access`, where the private key is entered once per browser.
- Added an HttpOnly `careeros_access` cookie that lasts 180 days.
- Added `CAREEROS_ACCESS_KEY` as the server-side private access key.
- Added `CAREEROS_OWNER_ID` as the single server-side owner id.
- Scoped all service-role reads and writes to `CAREEROS_OWNER_ID`.
- Kept `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Kept `/api/automation/run` protected by `Authorization: Bearer $CRON_SECRET` and exempt from the browser access cookie.
- Added fail-closed behavior when `CAREEROS_ACCESS_KEY` is absent.
- Preserved the Phase 1 Automation Inbox behavior: dismiss, save, firm linking/creation, and duplicate application protection.

Required Production configuration:

- Disable Vercel SSO Deployment Protection for the normal production URL if you want direct access without Vercel sign-in.
- Set `CAREEROS_ACCESS_KEY` to a strong private phrase or random token.
- Set `CAREEROS_OWNER_ID=00356437-063c-49a9-98a6-961f5d7b6eae`.
- Keep these server-side env vars configured:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `CRON_SECRET`

Data ownership:

- Do not roll back the previous owner migration.
- Do not reassign or duplicate existing rows.
- The existing production owner id is `00356437-063c-49a9-98a6-961f5d7b6eae`, which owns the current 29 firms, 39 applications, and 8 inbox results.
- Rollback for this PR is code/env only: redeploy the previous app version and remove `CAREEROS_OWNER_ID` / `CAREEROS_ACCESS_KEY` if no longer needed. No database rollback is required.

Validation checklist:

- Public `/inbox` redirects to `/access` when the cookie is absent.
- Public `/api/automation/inbox` returns `401` when the cookie is absent.
- Entering the access key sets the cookie and redirects to the requested page.
- `/inbox` loads 8 automation results after access.
- Firms remains 29.
- Applications remains 39.
- Wells Fargo remains exactly one `Saved` / `Prospect` application.
- Cron still authenticates with `CRON_SECRET` and writes to `CAREEROS_OWNER_ID` without an interactive browser cookie.
- `tsc --noEmit`, `npm run lint`, and `npm run build` pass.

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- Anyone with the private access key can open CareerOS, so store it like a password.
- This change does not start the networking inbox or any later automation phases.
