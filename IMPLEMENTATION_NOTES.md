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

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- Supabase Auth protects application routes. API routes that read or mutate user data return `401` without a valid session.
- The Automation Inbox API still uses the Supabase service-role key server-side, but every query is scoped to the authenticated Supabase user id.
- `CAREEROS_ALLOWED_EMAILS` is a comma-separated allowlist. Authenticated users outside this list receive `403`.
- Rollback for the owner migration: run the update statements in `supabase/transfer_legacy_owner_to_auth_user.sql` in reverse, setting `user_id` back to `00000000-0000-0000-0000-000000000001` for the same target user id.
- This phase covers daily opportunity results only. Weekly networking additions, company dossiers, Friday review, and Sunday digest should reuse the same `automation_results` inbox model in Phase 2.
