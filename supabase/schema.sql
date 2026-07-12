create extension if not exists "pgcrypto";

create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  name text not null,
  city text,
  state text,
  category text,
  priority text,
  website_url text,
  careers_url text,
  why_interested text,
  notes text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  firm_id uuid references firms(id) on delete set null,
  first_name text not null,
  last_name text not null,
  title text,
  linkedin_url text,
  email text,
  status text,
  last_contacted_at timestamptz,
  follow_up_at timestamptz,
  relationship_score integer check (relationship_score between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  firm_id uuid references firms(id) on delete set null,
  role_title text not null,
  city text,
  job_url text,
  status text,
  date_applied date,
  referral_contact_id uuid references contacts(id) on delete set null,
  interview_stage text,
  follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  firm_id uuid references firms(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists opportunity_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  action_id text not null,
  action_type text,
  title text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, action_id)
);

alter table firms drop constraint if exists firms_user_id_fkey;
alter table contacts drop constraint if exists contacts_user_id_fkey;
alter table applications drop constraint if exists applications_user_id_fkey;
alter table research_runs drop constraint if exists research_runs_user_id_fkey;
alter table opportunity_runs drop constraint if exists opportunity_runs_user_id_fkey;
alter table activity_log drop constraint if exists activity_log_user_id_fkey;

alter table firms alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table contacts alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table applications alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table research_runs alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table opportunity_runs alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table activity_log alter column user_id set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table firms enable row level security;
alter table contacts enable row level security;
alter table applications enable row level security;
alter table research_runs enable row level security;
alter table opportunity_runs enable row level security;
alter table activity_log enable row level security;

drop policy if exists "Users manage own firms" on firms;
drop policy if exists "Users manage own contacts" on contacts;
drop policy if exists "Users manage own applications" on applications;
drop policy if exists "Users manage own research" on research_runs;
drop policy if exists "Users manage own opportunity runs" on opportunity_runs;
drop policy if exists "Users manage own activity log" on activity_log;

create policy "Users manage own firms" on firms for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own contacts" on contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own applications" on applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own research" on research_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own opportunity runs" on opportunity_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own activity log" on activity_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists contacts_firm_id_idx on contacts(firm_id);
create index if not exists contacts_follow_up_at_idx on contacts(follow_up_at);
create index if not exists applications_firm_id_idx on applications(firm_id);
create index if not exists applications_follow_up_at_idx on applications(follow_up_at);
create index if not exists activity_log_action_id_idx on activity_log(action_id);
create index if not exists activity_log_completed_at_idx on activity_log(completed_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_firms_updated_at on firms;
create trigger set_firms_updated_at before update on firms
  for each row execute function set_updated_at();

drop trigger if exists set_contacts_updated_at on contacts;
create trigger set_contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

drop trigger if exists set_applications_updated_at on applications;
create trigger set_applications_updated_at before update on applications
  for each row execute function set_updated_at();

create table if not exists automation_settings (
  user_id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  enabled boolean not null default false,
  monthly_limit_usd numeric(10,2) not null default 35 check (monthly_limit_usd = 35),
  run_reserve_usd numeric(10,2) not null default 7 check (run_reserve_usd = 7),
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  run_key text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'skipped')),
  reserved_cost_usd numeric(10,2) not null default 7,
  estimated_cost_usd numeric(10,4) not null default 0,
  input_tokens integer,
  output_tokens integer,
  web_search_calls integer,
  opportunity_count integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, run_key)
);

alter table automation_settings enable row level security;
alter table automation_runs enable row level security;

drop policy if exists "Users manage own automation settings" on automation_settings;
drop policy if exists "Users manage own automation runs" on automation_runs;

create policy "Users manage own automation settings" on automation_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own automation runs" on automation_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists automation_runs_created_at_idx on automation_runs(user_id, created_at desc);

drop trigger if exists set_automation_settings_updated_at on automation_settings;
create trigger set_automation_settings_updated_at before update on automation_settings
  for each row execute function set_updated_at();

insert into automation_settings (user_id, enabled, monthly_limit_usd, run_reserve_usd)
values ('00000000-0000-0000-0000-000000000001'::uuid, false, 35, 7)
on conflict (user_id) do update set monthly_limit_usd = 35, run_reserve_usd = 7;

create table if not exists automation_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  job_type text not null,
  run_id uuid references automation_runs(id) on delete set null,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'saved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table automation_results enable row level security;

drop policy if exists "Users manage own automation results" on automation_results;

create policy "Users manage own automation results" on automation_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists automation_results_status_idx on automation_results(user_id, status, created_at desc);
