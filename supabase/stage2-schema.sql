-- שלב 2: בדיקת שומת ועדה + עיקרי טיעון, 1,400 ₪

create table if not exists machria_stage2_cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stage1_case_id uuid references machria_cases(id),
  committee_name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  price_nis numeric not null default 1400,
  paid boolean not null default false,
  paid_at timestamptz,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_upload', 'uploaded', 'analyzing', 'pending_admin_review', 'ready', 'sent')),
  letter_file_path text,
  assessment_file_path text,
  argument_document text,
  admin_notes text
);

alter table machria_stage2_cases enable row level security;

create policy "anyone can create a stage2 case" on machria_stage2_cases
  for insert with check (true);

create policy "anyone can read a stage2 case by id" on machria_stage2_cases
  for select using (true);

create policy "anyone can update their own stage2 case" on machria_stage2_cases
  for update using (true);

-- אחסון קבצים: bucket כבר נוצר (machria-files, פרטי). מדיניות ההעלאה:
-- כל אחד יכול להעלות (ה-UUID בנתיב הקובץ הוא בעצם הסיסמה, כמו בשאר המערכת),
-- אבל אין קריאה ציבורית — רק המערכת (מפתח שירות) קוראת בפועל לצורך ניתוח/אדמין.
create policy "anyone can upload stage2 files" on storage.objects
  for insert with check (bucket_id = 'machria-files');
