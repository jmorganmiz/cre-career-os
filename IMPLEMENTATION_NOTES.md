# CareerOS Private Single-User Mode

CareerOS now runs as a private single-user app protected by Vercel Deployment Protection. The app does not use a CareerOS login page, Supabase Auth callback, email allowlist, or browser session checks.

Implemented:

- Removed app-level Supabase Auth routes and login/logout UI.
- Added `CAREEROS_OWNER_ID` as the single server-side owner id.
- Scoped all service-role reads and writes to `CAREEROS_OWNER_ID`.
- Kept `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Kept `/api/automation/run` protected by `Authorization: Bearer $CRON_SECRET`.
- Added fail-closed behavior when `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true` is absent.
- Preserved the Phase 1 Automation Inbox behavior: dismiss, save, firm linking/creation, and duplicate application protection.

Required Production configuration:

- Enable Vercel Deployment Protection for the production deployment.
- Set `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true` only after Deployment Protection is enabled.
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
- Rollback for this PR is code/env only: redeploy the previous app version and remove `CAREEROS_OWNER_ID` if no longer needed. No database rollback is required.

Validation checklist:

- Protected production opens normally after Vercel authentication.
- Public unauthenticated access is blocked by Vercel Deployment Protection before the app responds.
- `/inbox` loads 8 automation results.
- Firms remains 29.
- Applications remains 39.
- Wells Fargo remains exactly one `Saved` / `Prospect` application.
- Unauthenticated direct API access is blocked by Vercel protection; if protection is bypassed in any environment, the app still returns `403` unless `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true` is configured.
- Cron still authenticates with `CRON_SECRET` and writes to `CAREEROS_OWNER_ID`.
- `tsc --noEmit`, `npm run lint`, and `npm run build` pass.

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true` is an operator assertion that Vercel Deployment Protection is enabled; the Next.js app cannot independently prove Vercel project protection settings at runtime.
- This change does not start the networking inbox or any later automation phases.
