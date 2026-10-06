-- Europe Service — схема БД (Netlify Database / Postgres). Ідемпотентна: можна запускати повторно.
-- Застосування: npm run db:migrate

create table if not exists vacancies (
  id          text primary key,
  path        text not null unique,
  active      boolean not null default true,
  sort        integer not null default 0,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists vacancies_active_idx on vacancies (active, sort);

-- Кожне збереження/видалення в адмінці пише сюди попередню версію → можна відновити.
create table if not exists vacancy_history (
  id          bigserial primary key,
  vacancy_id  text not null,
  action      text not null,          -- update | delete | create
  data        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists vacancy_history_vac_idx on vacancy_history (vacancy_id, created_at desc);

create table if not exists leads (
  id          text primary key,
  created_at  timestamptz not null default now(),
  name        text not null default '',
  phone       text not null,
  form        text not null default '',
  vacancy_id  text,
  vacancy_title text,
  answers     jsonb,
  page        text,
  referrer    text,
  utm         jsonb,
  gclid       text,
  gbraid      text,
  wbraid      text,
  fbclid      text,
  status      text not null default 'new',
  note        text,
  delivered   jsonb                   -- куди пішла заявка: telegram / bitrix / ...
);
create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_phone_idx on leads (phone);

-- Редагований контент сайту (команда, фото офісу, ліцензія) — ключ → JSON
create table if not exists settings (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
