create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'Utilisateur local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  parent_id text references categories(id) on delete cascade,
  budget_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id text primary key,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'savings', 'paypal', 'crypto')),
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  kind text not null check (kind in ('expense', 'income')),
  title text not null,
  description text not null default '',
  amount numeric(14, 2) not null check (amount >= 0),
  date date not null,
  time time not null,
  category_id text references categories(id),
  sub_category_id text references categories(id),
  account_id text references accounts(id),
  payment_method text not null,
  tags text[] not null default '{}',
  receipt_photo text,
  location text,
  recurrence text not null check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budgets (
  id text primary key,
  name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  period text not null check (period in ('weekly', 'monthly', 'yearly')),
  category_id text references categories(id),
  alert_threshold integer not null default 80 check (alert_threshold between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id text primary key,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount >= 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  due_date date,
  icon text not null default 'Target',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id text primary key,
  name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  renewal_date date not null,
  recurrence text not null check (recurrence in ('weekly', 'monthly', 'yearly')),
  notify_before_days integer not null default 1 check (notify_before_days >= 0),
  category_id text references categories(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debts (
  id text primary key,
  person text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  direction text not null check (direction in ('owed_by_me', 'owed_to_me')),
  due_date date,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists transactions_kind_date_idx on transactions(kind, date desc);
create index if not exists transactions_category_idx on transactions(category_id);
create index if not exists budgets_category_idx on budgets(category_id);
create index if not exists subscriptions_renewal_date_idx on subscriptions(renewal_date);
create index if not exists debts_due_date_idx on debts(due_date);
