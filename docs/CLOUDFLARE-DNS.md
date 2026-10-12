# europeservice.com.ua → новий сайт (Netlify): що зробити в Cloudflare

Час: 10–15 хвилин. Пошта (Google Workspace) і платіжна сторінка pay.europeservice.com.ua **не зачіпаються**.
Новий сайт уже чекає на домен у Netlify (сайт `europeservice-ua`, домен `europeservice.com.ua` + `www` додані 12.10.2026).

## 0. Резервна копія (1 хв)
Cloudflare → домен **europeservice.com.ua** → **DNS → Records** → кнопка **Export** (завантажиться файл зі всіма записами).
Збережіть його — це план повернення назад.

## 1. Корінь домену `europeservice.com.ua`
Зараз там 2 записи типу **A** (і, можливо, **AAAA**) з помаранчевою хмаркою — вони ведуть на Тільду.

1. Видаліть усі записи **A** і **AAAA** з Name = `europeservice.com.ua` (або `@`).
2. **Add record**:
   - Type: **CNAME**
   - Name: **@**
   - Target: **europeservice-ua.netlify.app**
   - Proxy status: **DNS only** (сіра хмарка — обов'язково, НЕ помаранчева)
   - TTL: Auto
3. Save.

## 2. `www`
Зараз: CNAME `www` → `europeservice.com.ua`.

1. Відкрийте цей запис → **Edit**:
   - Target: **europeservice-ua.netlify.app**
   - Proxy status: **DNS only** (сіра хмарка)
2. Save.

## 3. Нічого більше не чіпати
- **MX** (aspmx.l.google.com …) — пошта.
- **TXT** (SPF, DKIM, google-site-verification тощо).
- **CAA** — там уже дозволено `letsencrypt.org`, Netlify випустить сертифікат сам.
- **pay.europeservice.com.ua** і всі інші піддомени.
- Rules / Page Rules / SSL у Cloudflare — для записів із сірою хмаркою вони не діють, міняти не треба.

## 4. Після зміни
Напишіть, що готово (або скиньте скріншот записів `@` і `www`). Далі все робимо ми:
- Netlify сам випускає SSL-сертифікат Let's Encrypt (від кількох хвилин до години);
- ми вмикаємо головний домен на сайті й перевіряємо, що старі адреси, форми й заявки працюють уже на europeservice.com.ua.

Перевірити самому (через 5–15 хв): `https://europeservice.com.ua` відкривається з замочком і з новим дизайном.

## Якщо щось пішло не так — повернення за 2 хвилини
Видалити CNAME `@`, повернути записи **A**/**AAAA** кореня з файлу експорту (з помаранчевою хмаркою, як було), а `www` повернути на `europeservice.com.ua`. Сайт знову відкриватиметься з Тільди.
