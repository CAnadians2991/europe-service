# Резервні копії заявок

Кожна заявка з сайту спершу зберігається в базі сайту (адмінка → «Заявки», там же вивантаження CSV), потім іде в Bitrix24. Якщо Bitrix не прийняв заявку, в адмінці біля неї з'являється кнопка **«⚠️ Не в Bitrix — повторити»**.

Додатково заявку можна дублювати ще у два місця. Кожне вмикається змінною в Netlify: Project configuration → Environment variables. Після зміни змінної сайт треба перезібрати: Deploys → Trigger deploy.

## Google-таблиця — `LEAD_WEBHOOK_URL`

Кожна заявка стає новим рядком: дата (Київ), ім'я, телефон, форма, вакансія, відповіді квізу, джерело, кампанія, сторінка, «У Bitrix: так / НІ», ID.

1. Створіть Google-таблицю, наприклад «Заявки Personal Work (резерв)».
2. Відкрийте **Розширення → Apps Script**, видаліть усе в редакторі й вставте код нижче. Збережіть.
3. **Розгорнути → Нове розгортання → тип «Вебдодаток»**:
   - «Виконувати як»: **Я**;
   - «Хто має доступ»: **Усі**.
4. Натисніть «Розгорнути» і дайте дозвіл: «Додатково → Перейти до проєкту» → «Дозволити».
5. Скопіюйте «URL вебдодатка» (`https://script.google.com/macros/s/…/exec`) і додайте в Netlify змінну **`LEAD_WEBHOOK_URL`**.

```js
// Personal Work — резервна копія заявок з сайту
const SHEET = 'Заявки'
const HEAD = ['Дата', "Ім'я", 'Телефон', 'Форма', 'Вакансія', 'Відповіді', 'Джерело', 'Кампанія', 'Сторінка', 'У Bitrix', 'ID']

function doPost(e) {
  const d = JSON.parse(e.postData.contents)
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET)
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD)
    sh.setFrozenRows(1)
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold')
  }
  sh.appendRow([d.date, d.name, "'" + d.phone, d.form, d.vacancy, d.answers, d.source, d.campaign, d.page, d.bitrix, d.id])
  return ContentService.createTextOutput('ok')
}
```

## Discord — `DISCORD_WEBHOOK_URL`

Кожна заявка приходить окремим повідомленням у канал. Якщо Bitrix її не прийняв, у повідомленні буде позначка ⚠️.

1. Discord → ваш сервер → канал для заявок (наприклад `#заявки-pw`) → ⚙️ **Змінити канал → Інтеграції → Вебхуки → Новий вебхук**.
2. Назва — будь-яка, «Копіювати URL вебхука».
3. Додайте в Netlify змінну **`DISCORD_WEBHOOK_URL`**.

## Telegram (за бажанням) — `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`

Бот від @BotFather, чат або група з ботом; кілька чатів через кому.
