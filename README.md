# Personal Work — сайт кадрового агентства

Next.js 16 (App Router) + Tailwind 4 на **Netlify**: код — GitHub → Netlify, база — Netlify Database (Postgres), файли з адмінки — Netlify Blobs. Перенесено з Tilda (вересень 2026).

## Як це влаштовано
- **Публічний сайт** — статично згенеровані сторінки (UA + RU), дані вакансій з Postgres (`vacancies`), кеш оновлюється одразу після збереження в адмінці.
- **Адмінка** — `/admin` (пароль у змінній `ADMIN_PASSWORD`): вакансії (додати / редагувати / сховати / видалити з кошиком і історією версій), заявки (статуси, нотатки, CSV).
- **Заявки** — `POST /api/lead` → таблиця `leads` + сповіщення (Telegram / Bitrix24 / вебхук — див. змінні нижче).
- **Фото й файли** — імпортовані з Tilda лежать у `public/media` (WebP 480/800/1200), нові з адмінки — у Netlify Blobs (сховище `uploads`), віддаються за адресою `/uploads/…`.
- **База** — Netlify Database; схема — міграції в `netlify/database/migrations/` (застосовуються при деплої). Перед кожною збіркою `scripts/check-netlify-db.mjs` зупиняє деплой, якщо база порожня.
- **Трекінг** — GTM `GTM-WTXW8ZLT` (без змін у контейнері): після успішної заявки пушиться `submit_form_<форма>` (тригер `^submit_form` → конверсія Google Ads + GA4 `generate_lead`); `tel:`-кліки ловить GTM. Meta Pixel, TikTok — події `Lead` / `SubmitForm`. Трекери вантажаться після першої взаємодії (швидкість), `gclid/gbraid/wbraid/utm` зберігаються одразу в cookie й пишуться в заявку.

## Змінні середовища (Netlify → Project configuration → Environment variables)
| Змінна | Для чого |
|---|---|
| — | база й сховище файлів Netlify підключаються самі, змінних не треба |
| `DB_SCRIPT_TOKEN` | ключ для скриптів обслуговування: вони працюють з базою через `/api/db-script` (те саме значення — в Netlify і в локальному `.env.local`) |
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | вхід в адмінку |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | заявки в Telegram (можна кілька chat id через кому) |
| `BITRIX_WEBHOOK_URL` (+ `BITRIX_ASSIGNED_BY_ID`, `BITRIX_SOURCE_ID`) | заявки в Bitrix24 |
| `LEAD_WEBHOOK_URL` | будь-який вебхук (Google Sheets / Make / Zapier) |
| `NEXT_PUBLIC_SITE_URL` | за замовчуванням https://personalwork.com.ua |

## Команди
```bash
npm run dev            # локально (порт 3000)
npm run build          # продакшн-збірка
node --env-file=.env.local scripts/apply-text-fixes.mjs fixes.json --dry   # масові правки вакансій (з історією)
npm run import:vacancies / import:content   # повторний імпорт з експорту Tilda (scripts/import)
```
