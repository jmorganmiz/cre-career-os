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
2. Confirm Vercel has `CRON_SECRET`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_USER_ID`.
3. Deploy this branch/repo to Vercel.
4. In Settings, enable daily automation.
5. Click **Run now** once, then open **Automation Inbox**.

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- This phase covers daily opportunity results only. Weekly networking additions, company dossiers, Friday review, and Sunday digest should reuse the same `automation_results` inbox model in Phase 2.
