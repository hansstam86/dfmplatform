-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)

-- Projects table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  product_category text,
  build_stage text,
  regulatory_requirements text[],
  status text default 'draft',
  questions_used integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type text not null, -- 'prd' or 'bom'
  filename text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Outputs table (generated FMEA, charter, timeline)
create table if not exists outputs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type text not null, -- 'fmea', 'charter', 'timeline'
  title text,
  content jsonb not null,
  created_at timestamptz default now()
);

-- Questions table (refinement Q&A)
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  question text not null,
  answer text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table projects enable row level security;
alter table documents enable row level security;
alter table outputs enable row level security;
alter table questions enable row level security;

-- RLS Policies — users can only see their own data
create policy "Users see own projects" on projects for all using (auth.uid() = user_id);
create policy "Users see own documents" on documents for all using (
  project_id in (select id from projects where user_id = auth.uid())
);
create policy "Users see own outputs" on outputs for all using (
  project_id in (select id from projects where user_id = auth.uid())
);
create policy "Users see own questions" on questions for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

-- Storage bucket for documents
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict do nothing;

-- Storage policy
create policy "Users manage own documents" on storage.objects for all using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
