# Europe Service: перенесення з Tilda (жовтень 2026)

Новий сайт europeservice.com.ua = форк коду Personal Work (Next.js 16 + Netlify + Netlify Database).
Джерела:
- Експорт Tilda: `../tilda-export/project1613842/` (380 сторінок `page*.html`, `images/`, `files/`, `htaccess` = alias → файл).
- Тексти сторінок по блоках: `../tilda-data/pages_text/<alias з __ замість />.txt` (кожен блок Tilda = `--- recNNN type T ---`).
- Карта сторінок: `../tilda-data/pages.json` (f, alias, title, desc, lang, noindex).
- Tilda Feeds (вакансії й статті), отримані через API: `../tilda-data/feeds/<feeduid>.json` (список постів) і `../tilda-data/posts/<postuid>.json` (повний пост: title, descr, text = HTML, image, date, url).
  - 332920854629 «Статті» (UA, 190 постів, URL `/news/tpost/<uid>-<slug>`), 784197735863 «Статті RU» (45, `/ru/tpost/...`).
  - Решта фідів = вакансії (UA/RU по країнах), їх імпортує окремий скрипт.
- Tilda Store (каталог, що показує актуальні вакансії): `../tilda-data/store/<partuid>.json`.
- Сайт europeservice.com.ua зараз БЛОКУЄ IP цього Мака (410) — не ходити на нього; API `feeds.tildaapi.one` / `store.tildaapi.one` і CDN `static.tildacdn.com|one` працюють (не більше 2 запитів одночасно).

## Схема URL (зберігаємо адреси Tilda, де вони вже чисті)
| Що | UA | RU |
|---|---|---|
| Головна | `/` | `/ru` |
| Польща (країна) | `/vacancies` (так було на Tilda — лишаємо) | `/ru/vacancies` |
| Інші країни | `/vacancies/<chekhiia\|germany\|netherlands\|romania\|lithuania\|greece\|latvia\|austria\|italy\|belgium\|france\|canada\|hungary\|slovakia\|england>` | `/ru/vacancies/<те саме>` |
| Усі вакансії (новий каталог) | `/vacancies/all` | `/ru/vacancies/all` |
| SEO-лендинги Польщі (міста, сфери, професії) | `/vacancies/<slug>` як на Tilda | `/ru/vacancies/<slug>` |
| SEO-лендинги Чехії | `/vacancies/chekhiia/<slug>` | `/ru/vacancies/chekhiia/<slug>` (slug-и різні в UA і RU!) |
| Вакансія | `/vacancies/<країна>/<slug>` (новий чистий URL; для Польщі `poland`) | `/ru/vacancies/<країна>/<slug>` |
| Статті | `/news/<slug>`; сторінкові статті Tilda зберігають свій шлях (`/news/work_viza_in_poland_d`, `/kak-ustroitsya-na-rabotu-v-polshe`, `/poland`, `/germany/vyizd`…) | `/ru/news/<slug>` або свій старий шлях `/ru/...` |
| Послуги / Про нас / Відгуки / Контакти / Співпраця | `/poslugi`, `/about`, `/vidguki`, `/contacts`, `/cooperation` | `/ru/services`, `/ru/about`, `/ru/otzyvy`, `/ru/contacts` |
| Юридичні | `/privacy`, `/oferta`, `/user_deal`, `/declaration` | — |
| Квізи (реклама веде сюди — URL не міняти) | `/kviz-*`, `/form_*`, `/jooble-kviz`, `/visacanada`, `/poland-international` | — |

Старі `/vakansii/hungary|slovakia|england` → 301 на `/vacancies/...`; `tpost`-адреси → 301 на нові шляхи; технічні сторінки (header/footer/test/blocks/uploads/vac…) → 301 на найближчу живу.

## Формати (файли кладемо в `scripts/import/out/`, звідти `build_content.mjs` конвертує фото й пише `src/data/content/`)
Блоки контенту — тип `Block` з `src/lib/content.ts`:
```ts
{ type: 'h2'|'h3'|'p', text }      // у text дозволена ЛИШЕ розмітка посилань [текст](/шлях); переноси рядків \n
{ type: 'ul'|'ol', items: string[] }
{ type: 'img', src, alt? }          // src = 'images/<файл з експорту>' або повний URL https://static.tildacdn.(com|one)/...
{ type: 'quote', text, speaker? }
{ type: 'button', text, href }
{ type: 'details', summary, blocks } // FAQ / розгортання
{ type: 'video', youtube, title? }   // youtube = id ролика
```
Посилання всередині текстів переписуються на НОВІ шляхи (абсолютні europeservice.com.ua → відносні; tpost → новий шлях з карти редиректів).

Правила тексту:
- Прибрати сміття Tilda: «BUY NOW», «Load more», «Дізнатися більше» без посилання, порожні символи `⠀`/`⠀`, дублі шапки/футера, кнопки «Відгукнутися» без дії.
- Нічого не вигадувати: ні цифр, ні фактів. Можна виправляти явні описки та битий HTML.
- Застарілий зміст (COVID-обсервація 2020–21, правила в'їзду 2020–22, «2022 рік» як актуальний) — `outdated: true` (сторінка лишається, але noindex).
- Ліцензія №223 від 15.02.2019 належить ТОВ «ЄВРОПА СЕРВІС УКРАЇНА» — це компанія цього сайту, згадувати можна.
- У вакансіях і лендингах — без обмежень за статтю й віком (закон «Про зайнятість населення», ст. 11): не писати «тільки для чоловіків», «до 45 років».
