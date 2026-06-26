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

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists set_automation_settings_updated_at on automation_settings;
create trigger set_automation_settings_updated_at before update on automation_settings
  for each row execute function set_updated_at();

insert into automation_settings (user_id, enabled, monthly_limit_usd, run_reserve_usd)
values ('00000000-0000-0000-0000-000000000001'::uuid, false, 35, 7)
on conflict (user_id) do update set monthly_limit_usd = 35, run_reserve_usd = 7;