-- מיזם "בדיקת היטל השבחה" — סכמת Supabase
-- להריץ בפרויקט Supabase ייעודי חדש (לא באותו פרויקט של insure-vda)

create extension if not exists "pgcrypto";

-- ועדות מקומיות: מטא-דאטה מהמאגר הממשלתי + סטטוס סיווג
create table if not exists committees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  decisions_count int not null default 0,
  classified boolean not null default false,
  classified_at timestamptz,
  price_tier smallint not null default 1 check (price_tier in (1, 2, 3)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- הכרעות: מטא-דאטה נטענת בבת אחת אחרי שלב 1 (סקרייפר), classification מתמלא לפי דרישה
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  committee_name text not null,
  appraisal_header text not null,
  appraiser text,
  block text,
  plot text,
  decision_date date,
  publicity_date date,
  pdf_url text not null,
  appraisal_type text, -- היטל השבחה / תביעת פיצויים / הפקעות
  status text not null default 'pending' check (status in ('pending', 'classified', 'failed')),
  classification jsonb, -- הפלט המלא של classify-v3 (parties, components, stated_totals, sugiyot, וכו') — null עד שסווג
  lint_flags jsonb not null default '[]'::jsonb, -- תוצאת linter, לבקרת אדמין
  classified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appraisal_header, publicity_date)
);

create index if not exists idx_decisions_committee on decisions(committee_id);
create index if not exists idx_decisions_status on decisions(status);

-- אצוות סיווג (Anthropic Batch API) — לוועדות גדולות שלא נכנסות בזמן ריצה אחד
create table if not exists classification_batches (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  anthropic_batch_id text not null,
  status text not null default 'submitted' check (status in ('submitted', 'processing', 'ended', 'ingested', 'error')),
  decision_ids uuid[] not null, -- מיפוי custom_id -> decision.id
  submitted_at timestamptz not null default now(),
  ended_at timestamptz,
  error text
);

-- תיקי לקוחות (מוצר 1: בדיקה מקדימה)
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  committee_name text not null,
  address text,
  block text,
  plot text,
  contact_name text,
  contact_phone text,
  contact_email text,
  price_nis numeric not null,
  paid boolean not null default false,
  paid_at timestamptz,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'queued_for_classification', 'ready', 'sent')),
  report_html text, -- הדוח הסופי שנשלח ללקוח, לתיעוד ולשליחה חוזרת
  cardcom_deal_id text,
  notes text -- הערות אדמין
);

-- שורה תחתונה: RLS. הלקוח קורא/כותב ישירות מהצד (anon key), אז חייבים מדיניות מגבילה.
alter table committees enable row level security;
alter table decisions enable row level security;
alter table cases enable row level security;

-- committees: קריאה ציבורית (בשביל תצוגת המחיר), בלי כתיבה מהצד
create policy "committees are publicly readable" on committees
  for select using (true);

-- decisions: לא נחשפות ללקוח ישירות בשלב הזה (המוצר עדיין לא מציג רשימת הכרעות ללקוח לבד) — בלי מדיניות select ציבורית

-- cases: לקוח יכול ליצור תיק חדש (insert), אבל לא לקרוא/לעדכן תיקים של אחרים
create policy "anyone can create a case" on cases
  for insert with check (true);
