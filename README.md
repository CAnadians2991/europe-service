# Europe Service — сайт кадрового агентства (europeservice.com.ua)

Next.js 16 (App Router) + Tailwind 4 на **Netlify**: база — Netlify Database (Postgres), файли з адмінки — Netlify Blobs. Перенесено з Tilda (жовтень 2026), код — форк сайту Personal Work.

## Як це влаштовано
- **Адреси як на Tilda** (сайт ранжується з ними): Польща — `/vacancies`, країни — `/vacancies/<germany|chekhiia|…>`, SEO-лендинги міст і професій — `/vacancies/<slug>`, `/vacancies/chekhiia/<slug>`, статті — свої шляхи або `/news/<slug>`, квізи з реклами — `/kviz-*`, `/form_*`. Новий каталог усіх країн — `/vacancies/all`, сторінки вакансій — `/vacancies/<країна>/<назва>`. Російська версія — під `/ru`.
- **Старі адреси**: `/vakansii/*`, `page*.html`, технічні сторінки Tilda → 308 (`src/data/legacy-redirects.json`); 1 600+ адрес постів Tilda `…/tpost/<uid>-…` → нова сторінка вакансії / статті або сторінка країни (`src/data/tpost-redirects.json`, обробляє `src/proxy.ts`).
- **Вакансії** — у Netlify Database (`vacancies`), до першого заповнення — з `src/data/vacancies.seed.json`. Кеш сторінок оновлюється після збереження в адмінці.
- **Контент** (лендинги, статті, сторінки, квізи, відгуки) — JSON у `src/data/content/`, згенерований скриптами з експорту Tilda.
- **Адмінка** — `/admin` (пароль — змінна `ADMIN_PASSWORD`): вакансії, заявки, файли, країни, «Про нас».
- **Заявки** — `POST /api/lead` → таблиця `leads` + канали зі змінних середовища (Bitrix24, Google Sheet, Telegram).
- **Трекінг** — GTM `GTM-TGV63W5` (події `submit_form_<форма>` і `form_completion` як на Tilda), Meta Pixel, TikTok, Ringostat.

## Змінні середовища (Netlify → Project configuration → Environment variables)
| Змінна | Для чого |
|---|---|
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | вхід в адмінку |
| `DB_SCRIPT_TOKEN` | скрипти обслуговування працюють з базою через `/api/db-script` (те саме значення — в `.env.local`) |
| `BITRIX_WEBHOOK_URL` (+ `BITRIX_SOURCE_ID`, `BITRIX_ASSIGNED_BY_ID`) | заявки в Bitrix24 |
| `TILDA_WEBHOOK_URL` | або заявки у старий обробник форм Tilda (той самий формат JSON) |
| `LEAD_WEBHOOK_URL`, `LEAD_SHEET` | резервна копія заявок у Google Sheet (вкладка `LEAD_SHEET`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | сповіщення про заявки в Telegram |

## Команди
```bash
npm run dev                                   # локально
npm run build                                 # продакшн-збірка
node --env-file=.env.local scripts/seed-db.mjs   # залити вакансії з імпорту в порожню базу
python3 scripts/import/extract_es_vacancies.py && node scripts/import/build_seed.mjs   # повторний імпорт вакансій з Tilda
node scripts/import/build_content.mjs        # зібрати контент і редиректи з scripts/import/out
```
Деталі перенесення — `docs/MIGRATION.md`.
