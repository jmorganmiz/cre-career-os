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
2. Protect the entire deployment with Vercel Deployment Protection or equivalent access control.
3. Confirm Vercel has `CRON_SECRET`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_USER_ID`, and `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true`.
4. Deploy this branch/repo to Vercel.
5. In Settings, enable daily automation.
6. Click **Run now** once, then open **Automation Inbox**.

Notes:

- Vercel cron uses UTC. `14:00 UTC` is 9:00 AM Central during daylight saving time and 8:00 AM Central during standard time.
- The Automation Inbox API uses the Supabase service-role key. It fails closed unless `CAREEROS_PRIVATE_DEPLOYMENT_ACK=true` is set, and that acknowledgement must only be set after the full deployment is privately protected.
- This phase covers daily opportunity results only. Weekly networking additions, company dossiers, Friday review, and Sunday digest should reuse the same `automation_results` inbox model in Phase 2.
