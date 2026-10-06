# Russian versions of Europe Service pages — translator brief

Europe Service (ТОВ «ЄВРОПА СЕРВІС УКРАЇНА», Kyiv) is a licensed recruitment agency placing Ukrainians in official jobs in Poland, Germany, Czechia, the Netherlands and other EU countries. The site is Ukrainian first; every page also gets a Russian version at `/ru` + the same address. Readers are Ukrainians who prefer Russian — write for them, not for Russia.

## Input / output
- Input chunk `chunks/cN.json`: `{ "<kind>:<path>": { kind, path, ruPath, strings: { "<pointer>": "<Ukrainian text>" } } }`. Pointers are like `blocks.3.items.2`, `seoTitle`, `faq.1.a`, `questions.0.options.2`.
- Output `out/cN.json`: exactly the same keys and the same pointers, each value = the Russian text: `{ "<key>": { "strings": { "<pointer>": "<Russian>" } } }`. Do not add or drop pointers. Do not touch anything that is not in `strings`.
- Check: `python3 check.py chunks/cN.json out/cN.json` must end with «OK — no problems». Fix every ERROR; read the warnings.
- Write the output with a Python script (json.dump, ensure_ascii=False) — never hand-edit JSON with quotes in it.

## Translation norms
- Natural modern Russian as used in Ukraine's job market; no calques from Ukrainian («працевлаштування» → «трудоустройство», «вакансія» → «вакансия», «житло» → «жильё/жилье» (use «жилье» without ё), «зарплата на руки», «Умова/договір» → «договор»).
- «в Украине» (never «на Украине»); «Киев», «Львов», «Ровно», «Житомир», «Одесса»; Polish cities in the usual Russian form (Вроцлав, Гданьск, Катовице, Познань, Щецин, Лодзь, Краков, Люблин, Жешув); Czech/German/Dutch place names in the usual Russian form, Latin names of small towns stay as they are.
- Keep: brand names (Europe Service, DINO, Amazon…), legal Polish/Czech terms in Latin (Umowa Zlecenie, Umowa o Pracę, PESEL, Karta Pobytu, oświadczenie, A1, ZUS), all numbers, currencies and dates exactly as in the source (decimal comma stays: «29,77 zł»), phone numbers, e-mails, emoji.
- Markdown inside strings: keep `**bold**` and links `[text](/path)` — translate the link text, never change the URL. Keep line breaks (`\n`).
- Translate fully and faithfully: same facts, same meaning, same length ±20%. Do not summarise, do not add new claims, prices or promises. If the source is outdated (an old year, a past law), translate it as is — the page is marked outdated by the site.
- No restrictions by age or gender may be added. Gender-neutral forms where the source has them.
- Quiz option texts are answers that reach the manager — translate them short and clear. Legal documents (privacy, oferta, user agreement, declaration): precise legal Russian, keep numbering and terms; do not soften obligations.

## SEO (Google, Gemini/ChatGPT answers)
- `seoTitle` (and `title` of landings): a real Russian search phrase first, ≤ 65 characters, no clickbait, keep the year if the source has one (2026). E.g. «Работа в Польше на складе для украинцев — вакансии 2026».
- `seoDescription` / `description`: 120–155 characters, the main Russian keyword in the first half, one concrete benefit (official contract, free selection, housing), no quotes or emoji spam.
- Headings (h2/h3): translate meaningfully so they read as Russian search queries where natural («Как получить PESEL», «Сколько платят на складе в Польше»).
- FAQ answers: first sentence answers the question directly (that sentence is what AI answers quote).
- Use the established Russian keyword, not a literal translation: «работа в Польше», «вакансии в Германии», «работа за границей для украинцев», «биометрия», «безвиз», «освядчение», «рабочая виза».
