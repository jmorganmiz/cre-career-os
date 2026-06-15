# CRE Career OS

A focused operating system for a post-grad search across commercial real estate, multifamily, lending, PropTech, and AI-related real estate roles.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL and anon key.

The current UI uses realistic local starter data, so it works before Supabase is configured. `src/lib/supabase.ts` exposes the configured client for replacing starter data with authenticated queries.

Once configured, use the avatar in the top-right to send yourself a Supabase magic sign-in link. Firms, contacts, applications, dashboard counts, and CSV imports will then use your live database.

## Research agent

Add `OPENAI_API_KEY` to `.env.local` to enable live firm research with web search. Without a key, the research page returns a clearly marked demo brief.

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

The agent researches and drafts only. It does not send messages or change records without user action.

## CSV import

Use **Import CSV** on the Firms, Contacts, or Applications page. The first row should contain database field names. Contacts and applications can link to an existing firm using its Supabase `firm_id`.

```csv
name,city,state,category,priority,website_url,careers_url,why_interested,notes
Greystar,Charleston,SC,Multifamily,Tier 1,https://greystar.com,https://jobs.greystar.com,Global operating platform,
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
