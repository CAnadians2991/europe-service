# SEO: що збережено з Tilda (жовтень 2026)

Сайт роками просувався посиланнями (зокрема купленими), тому **жодна адреса Tilda не змінюється**, а нові сторінки створюються за тією ж логікою.

| Тип сторінки | Адреса (як на Tilda) | Звідки дані |
|---|---|---|
| Польща / країни | `/vacancies`, `/vacancies/<country>`, `/vakansii/hungary|slovakia|england`, `/ru/…` | `src/data/content/landings.json` |
| SEO-лендинги | `/vacancies/<slug>`, `/vacancies/chekhiia/<slug>`, `/ru/vacancies/<slug>`, навіть `/ru/vacanciesrabota_v_polshe_mekanikom` і дублікати (`/vacancies/chekhiia/brno`) | там само |
| Вакансії (пости Tilda Feeds) | `/tpost/<uid>-<slug>`, `/vacancies/netherlands/tpost/<uid>-<slug>` — адреса з Tilda `sitemap-feed-*.xml` | БД `vacancies` (225 відкритих + 1 226 закритих) |
| Закриті вакансії | та сама адреса, сторінка жива й індексується, з текстом і позначкою «набір закрито» (як на Tilda) | `data/vacancies.closed.json` → БД |
| Нова вакансія з адмінки | `/tpost/<9 символів + 1>-<транслітерація назви>` — так само, як Tilda Feeds; адреса опублікованої вакансії не змінюється | `newVacancyPath()` у `src/lib/site.ts` |
| Статті (пости) | `/news/tpost/…`, `/news/<рубрика>/tpost/…`, `/ru/tpost/…`, `/tpost/…` | `articles.json` |
| Статті-сторінки | `/news/<alias>`, `/poland`, `/germany/vyizd`, `/kak-ustroitsya-na-rabotu-v-polshe`… | там само |
| Службові | `/about`, `/poslugi`, `/vidguki`, `/news`, `/contacts`, `/cooperation`, `/privacy`, `/oferta`, `/user_deal`, `/declaration`, `/ru/about`… | `pages.json`, `legal.json` |
| Квізи з реклами | `/kviz-*`, `/form_*`, `/jooble-kviz`, `/visacanada`, `/poland-international` | `quizzes.json` |
| Усі вакансії | `/vacancies/aktualni_vakansii` (сторінка «Актуальні вакансії» Tilda, тепер каталог) | — |

**Title і description** — дослівно з Tilda (лендинги, статті, службові сторінки, головна); заголовок вакансії — назва поста. Canonical — на власну адресу (як на Tilda). Архівні статті не закриті від індексації.

**Редиректи (308 = постійний):** той самий пост під іншим префіксом (`/vac/tpost/…`, `/uploads/tpost/…`, `/test/tpost/…`) → канонічна адреса; `page<id>.html` → сторінка; технічні сторінки (header/footer/test…) → найближча жива; `/sitemap-feeds.xml`, `/sitemap-feed-*.xml`, `/sitemap-store.xml` → `/sitemap.xml`; великі літери, слеш у кінці, `/index.html` → одна адреса за один крок. Списки: `src/data/legacy-redirects.json`, `src/data/tpost-redirects.json`, логіка — `src/lib/legacy-urls.ts`.

**Search Console:** токен підтвердження з Tilda (`src/lib/site-verification.ts`). Після переїзду — надіслати `/sitemap.xml`.

**Що прибрано свідомо:** розмітка Product з рейтингом «5 ★, 33 відгуки» на головній Tilda (самопроголошені відгуки — ризик ручних санкцій Google).
