# CareerOS Automation Inbox - Phase 1

Implemented:

- Daily Vercel cron at `0 14 * * *` calling `/api/automation/run`.
- New `automation_results` Supabase table and RLS policy.
- Daily opportunity runs write each new role into the Automation Inbox.
- New `/inbox` page with:
  - Open official source
  - Dismiss
  - Save to pipeline
- Saving an inbox item:
  - Finds or creates the firm
  - Adds the role to Applications with status `Saved`
  - Sets interview stage to `Prospect`
  - Avoids duplicate firms and obvious duplicate applications
- Updated Settings language from weekly to daily automation.

Deployment steps:

1. Run `supabase/automation.sql` in the Supabase SQL Editor.
2. Configure Supabase Auth for either Google OAuth or email magic links.
3. Confirm Vercel has `CRON_SECRET`, `CRON_USER_ID`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `CAREEROS_ALLOWED_EMAILS`.
4. Sign in once so your Supabase Auth user exists.
5. Run `supabase/transfer_legacy_owner_to_auth_user.sql` after replacing `REPLACE_WITH_SUPABASE_AUTH_USER_ID` with your real Supabase Auth user id.
6. Deploy this branch/repo to Vercel.
7. In Settings, enable daily automation.
8. Click **Run now** once, then open **Automation Inbox**.

Supabase Auth setup:

- Production env vars required:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `CAREEROS_ALLOWED_EMAILS`
  - `OPENAI_API_KEY`
  - `CRON_SECRET`
  - `CRON_USER_ID`
- Supabase Auth redirect URLs should include:
  - `https://cre-career-os.vercel.app/auth/callback`
  - The active Preview deployment callback URL when validating a branch, for example `https://cre-career-igybil13x-jmorganmizs-projects.vercel.app/auth/callback`
- `CAREEROS_ALLOWED_EMAILS` is a comma-separated allowlist. Authenticated users outside this list receive `403`.
- `CRON_USER_ID` should be set to the authenticated Supabase user id that owns CareerOS rows after the owner migration.

Preview validation completed on `https://cre-career-igybil13x-jmorganmizs-projects.vercel.app`:

- `/login`: `200 OK`
- Unauthenticated `/inbox`: `307` to `/login?next=%2Finbox`
- Unauthenticated `/api/automation/inbox`: `401 Unauthorized`
- Authenticated `/api/data`: `configured=true`, 29 firms, 39 applications
- Authenticated `/api/automation/inbox`: 8 results
- Authenticated `/inbox`: `200 OK`
- `POST /api/auth/logout`: `200 OK`, `{"ok":true}`
- Wells Fargo Saved / Prospect application remains exactly one

Owner migration counts:

- Before migration:
  - Legacy owner: 29 firms, 39 applications, 8 inbox results
  - Authenticated user: 0 firms, 0 applications, 0 inbox results
  - Wells Fargo Saved / Prospect applications: 1
- After migration:
  - Legacy owner: 0 firms, 0 applications, 0 inbox results
  - Authenticated user: 29 firms, 39 applications, 8 inbox results
  - Wells Fargo Saved / Prospect applications: 1
- The original 28 firms / 38 applications baseline became 29 / 39 after Phase 1 live validation created the Wells Fargo firm and Saved / Prospect application.

Owner migration rollback:

- Run the same update statements from `supabase/transfer_legacy_owner_to_auth_user.sql` in reverse inside a transaction.
- Set `user_id` back to `00000000-0000-0000-0000-000000000001` where `user_id` equals the real Supabase Auth user id.
- Verify counts before and after rollback.

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- Supabase Auth protects application routes. API routes that read or mutate user data return `401` without a valid session.
- The Automation Inbox API still uses the Supabase service-role key server-side, but every query is scoped to the authenticated Supabase user id.
- The cron route continues to use `Authorization: Bearer $CRON_SECRET` plus `CRON_USER_ID`; it does not require an interactive browser session.
- Rollback for the owner migration: run the update statements in `supabase/transfer_legacy_owner_to_auth_user.sql` in reverse, setting `user_id` back to `00000000-0000-0000-0000-000000000001` for the same target user id.
- This phase covers daily opportunity results only. Weekly networking additions, company dossiers, Friday review, and Sunday digest should reuse the same `automation_results` inbox model in Phase 2.
