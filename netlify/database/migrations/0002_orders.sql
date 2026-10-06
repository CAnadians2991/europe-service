-- Замовлення з кошика /oplata: товари й суми рахує сервер з каталогу (src/lib/shop.ts), статус оновлюють вебхуки банків
create table if not exists orders (
  id            text primary key,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        text not null default 'new',      -- new | pending | paid | failed | canceled | manual
  method        text not null default 'manual',   -- monopay | monoparts | privatparts | manual
  amount        integer not null,                 -- копійки
  currency      text not null default 'UAH',
  parts         integer,                          -- кількість платежів для оплати частинами
  items         jsonb not null,                   -- [{id, title, qty, price}]
  customer      jsonb not null,                   -- {name, phone, email, comment}
  lang          text not null default 'uk',
  provider_ref  text,                             -- invoiceId / order_id банку
  provider_data jsonb,                            -- остання відповідь / вебхук банку
  page          text,
  attr          jsonb
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_provider_ref_idx on orders (provider_ref);
