-- Posterity Impact Initiative: database schema
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It is safe to run again: nothing is dropped or overwritten.

create extension if not exists pgcrypto;

-- Every Paystack payment, written by /api/paystack-webhook
create table if not exists donations (
  reference     text primary key,
  donor_name    text,
  donor_email   text,
  amount        numeric(14, 2) not null,
  currency      text default 'NGN',
  frequency     text default 'once',
  status        text not null,
  channel       text,
  paystack_data jsonb,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Money spent, entered by an admin
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  spent_on    date not null,
  description text not null,
  amount      numeric(14, 2) not null check (amount > 0),
  reference   text,
  created_by  text,
  created_at  timestamptz not null default now()
);

-- The opportunities board
create table if not exists opportunities (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  organiser     text not null,
  type          text not null,
  summary       text not null,
  eligibility   text,
  url           text not null,
  opens         date,
  deadline      date,
  deadline_note text,
  checked       date not null,
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Listings found automatically carry verified = false until a person
-- confirms them. source_id is the feed link, used to avoid duplicates.
alter table opportunities add column if not exists verified  boolean not null default true;
alter table opportunities add column if not exists source    text;
alter table opportunities add column if not exists source_id text;
create unique index if not exists opportunities_source_id_key on opportunities (source_id);

-- Newsletter list
create table if not exists subscribers (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- Contact form messages
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- Lock every table. With row level security on and no policies, the
-- public (anon) key can read and write nothing. Only the website's
-- server functions, which hold the service role key, can reach the data.
alter table donations     enable row level security;
alter table expenses      enable row level security;
alter table opportunities enable row level security;
alter table subscribers   enable row level security;
alter table messages      enable row level security;

-- Starting listings (only added when the board is empty)
insert into opportunities (title, organiser, type, summary, eligibility, url, opens, deadline, deadline_note, checked)
select * from (values
  ('Commonwealth Shared Scholarships 2027/28', 'Commonwealth Scholarship Commission (UK)', 'Scholarship',
   'Fully funded one-year Master''s study at participating UK universities, covering tuition, return airfare and a monthly living allowance.',
   'Nigerian citizens resident in Nigeria with at least an upper second-class first degree, who could not otherwise afford to study in the UK.',
   'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/', null::date, date '2026-12-08', 'Closes 16:00 GMT', date '2026-11-18'),
  ('Gates Cambridge Scholarship 2027', 'Gates Cambridge Trust, University of Cambridge', 'Scholarship',
   'Scholarships for postgraduate study at the University of Cambridge. Check the course funding deadline for the course you are applying to.',
   'Citizens of any country outside the UK applying for a full-time postgraduate course at Cambridge.',
   'https://www.gatescambridge.org/apply/timeline/', null::date, date '2026-12-08', '8 December 2026 or 6 January 2027, depending on your course', date '2026-11-18'),
  ('TEF Entrepreneurship Programme', 'Tony Elumelu Foundation', 'Grant',
   'Business training, mentoring and US$5,000 in non-refundable seed capital for participants who complete the programme.',
   'Africans aged 18 or over, living in Africa, with a business idea or a business no more than five years old.',
   'https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme', date '2027-01-01', date '2027-03-01', 'Portal opens 1 January and closes 1 March each year', date '2026-11-18'),
  ('Mastercard Foundation Scholars Program', 'Mastercard Foundation and partner universities', 'Scholarship',
   'Scholarships for study at partner universities in Africa and abroad. You apply directly to the partner institution you want to attend.',
   'Set by each partner institution. The Foundation never asks individuals for payment.',
   'https://www.mastercardfdn.org/en/what-we-do/our-programs/mastercard-foundation-scholars-program/where-to-apply/', null::date, null::date, 'Deadlines vary by partner university', date '2026-11-18')
) as seed
where not exists (select 1 from opportunities);
