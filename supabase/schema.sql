create extension if not exists "pgcrypto";

create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  city text, state text, category text, priority text,
  website_url text, careers_url text, why_interested text, notes text, ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete set null,
  first_name text not null, last_name text not null, title text,
  linkedin_url text, email text, status text,
  last_contacted_at timestamptz, follow_up_at timestamptz,
  relationship_score integer check (relationship_score between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete set null,
  role_title text not null, city text, job_url text, status text,
  date_applied date,
  referral_contact_id uuid references contacts(id) on delete set null,
  interview_stage text, follow_up_at timestamptz, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table firms enable row level security;
alter table contacts enable row level security;
alter table applications enable row level security;

create policy "Users manage own firms" on firms for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own contacts" on contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own applications" on applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists contacts_firm_id_idx on contacts(firm_id);
create index if not exists contacts_follow_up_at_idx on contacts(follow_up_at);
create index if not exists applications_firm_id_idx on applications(firm_id);
create index if not exists applications_follow_up_at_idx on applications(follow_up_at);

create table if not exists research_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table research_runs enable row level security;
create policy "Users manage own research" on research_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists opportunity_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table opportunity_runs enable row level security;
create policy "Users manage own opportunity runs" on opportunity_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
