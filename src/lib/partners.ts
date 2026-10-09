/**
 * «Співпраця» — one page in four languages for B2B: employers and labour agencies in the EU (need workers),
 * partner agencies from other countries, freelance recruiters. Owner, 2026-10: 65+ recruiters in our offices,
 * «we close any position with candidates». /cooperation stays the English page (Tilda URL, indexed in English).
 */
export type PartnerLang = 'uk' | 'ru' | 'en' | 'pl'
export type PartnerKind = 'employer' | 'agency' | 'freelancer'

export const PARTNER_PATHS: Record<PartnerLang, string> = {
  uk: '/spivpratsya',
  ru: '/ru/sotrudnichestvo',
  en: '/cooperation',
  pl: '/pl/wspolpraca',
}
export const PARTNER_LANGS: { lang: PartnerLang; label: string; name: string }[] = [
  { lang: 'uk', label: 'UA', name: 'Українська' },
  { lang: 'ru', label: 'RU', name: 'Русский' },
  { lang: 'en', label: 'EN', name: 'English' },
  { lang: 'pl', label: 'PL', name: 'Polski' },
]

/** hreflang cluster of the four pages (English is the default for visitors from other countries) */
export const partnerAlternates = () => ({ ...PARTNER_PATHS, 'x-default': PARTNER_PATHS.en })

/**
 * Recruitment volume. Owner gave 65+ recruiters; monthly / yearly numbers are derived from the company's own
 * «80 000+ clients in 7 years» (≈ 11 400 a year, ≈ 950 a month) — rounded down; replace when the owner sends exact figures.
 */
export const VOLUME = { recruiters: 65, perMonth: 900, perYear: 11000, since: 2018, offices: 5 }

type Copy = {
  metaTitle: string
  metaDescription: string
  crumb: string
  home: string
  eyebrow: string
  h1: string
  /** the H1 of the old Tilda page at this address (kept as the <h1>; `h1` is then shown as the big line) */
  tildaH1?: string
  sub: string
  cta: string
  langs: string
  stats: (vac: number, countries: number) => [string, string][]
  whoTitle: string
  who: { kind: PartnerKind; title: string; text: (vac: number) => string; cta: string }[]
  howTitle: string
  how: [string, string][]
  countriesTitle: string
  trust: string
  formTitle: string
  formSub: string
  faqTitle: string
  faq: { q: string; a: string }[]
}

const num = (n: number, lang: PartnerLang) => new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US').format(n).replace(/[  ]/g, ' ')

export const PARTNER: Record<PartnerLang, Copy> = {
  uk: {
    metaTitle: 'Співпраця — працівники з України для роботодавців і агенцій',
    metaDescription: 'Підбираємо працівників з України для роботодавців і агенцій праці в ЄС: 65+ рекрутерів, 5 офісів, з 2018 року. Партнерство для агенцій і рекрутерів-фрилансерів.',
    crumb: 'Співпраця',
    home: 'Головна',
    eyebrow: 'Співпраця',
    h1: 'Закриємо вашу вакансію кандидатами з України',
    sub: 'З 2018 року підбираємо працівників для роботодавців і агенцій праці в Європі. Відкриті до партнерства з агенціями з різних країн і рекрутерами-фрилансерами.',
    cta: 'Залишити заявку',
    langs: 'Ця сторінка іншими мовами:',
    stats: (vac, countries) => [
      [`${VOLUME.recruiters}+`, 'рекрутерів у наших офісах'],
      [`${num(VOLUME.perMonth, 'uk')}+`, 'кандидатів щомісяця'],
      [`${num(VOLUME.perYear, 'uk')}+`, 'працевлаштованих щороку'],
      [String(countries), `країн, ${vac} відкритих вакансій`],
    ],
    whoTitle: 'Кому ми корисні',
    who: [
      { kind: 'employer', title: 'Роботодавцям і агенціям праці в ЄС', text: () => 'Закриємо будь-яку позицію: склади, виробництво, будівництво, готелі й ресторани, водії, сільське господарство. Пошук, відбір, документи й доїзд кандидатів — на нас.', cta: 'Потрібні працівники' },
      { kind: 'agency', title: 'Агенціям-партнерам', text: () => 'Обмінюємося вакансіями й кандидатами з агенціями з різних країн. Спільні проєкти на прозорих партнерських умовах.', cta: 'Стати партнером' },
      { kind: 'freelancer', title: 'Рекрутерам-фрилансерам', text: (vac) => `Працюйте з нашими ${vac} вакансіями з будь-якого міста: приводьте кандидатів і отримуйте винагороду за тих, хто вийшов на роботу. Навчимо й дамо координатора.`, cta: 'Долучитися' },
    ],
    howTitle: 'Як ми закриваємо вакансії',
    how: [
      ['Бриф', 'Обговорюємо позицію, умови, графік і житло, погоджуємо терміни.'],
      ['Пошук', `${VOLUME.recruiters}+ рекрутерів у ${VOLUME.offices} офісах і власні онлайн-канали.`],
      ['Відбір', 'Співбесіда, перевірка досвіду й документів — до вас їдуть ті, хто підходить.'],
      ['Документи й доїзд', 'Допомагаємо з візами й дозволами, квитками й маршрутом до місця роботи.'],
      ['Супровід', 'Координатор на зв’язку з кандидатом і з вами — до виходу на роботу й після.'],
    ],
    countriesTitle: 'Наші кандидати працюють у країнах',
    trust: 'ТОВ «Європа Сервіс Україна», ЄДРПОУ 42515343 · ліцензія Мінсоцполітики № 223 від 15.02.2019',
    formTitle: 'Розкажіть про ваш запит',
    formSub: 'Менеджер відділу партнерства зв’яжеться з вами. Або напишіть нам на',
    faqTitle: 'Питання партнерів',
    faq: [
      { q: 'Які позиції ви закриваєте?', a: 'Робітничі й технічні: склади й логістика, виробництво, харчова промисловість, автозаводи, будівництво, готелі й ресторани, прибирання, сільське господарство, водії. Під кожен запит збираємо окрему команду рекрутерів.' },
      { q: 'Звідки ваші кандидати?', a: `Переважно з України: ${VOLUME.offices} наших офісів (Київ, Львів, Рівне, Житомир, Одеса) і власні онлайн-канали. Кандидати проходять співбесіду й перевірку документів до виїзду.` },
      { q: 'Як стати рекрутером-фрилансером?', a: 'Залиште заявку з позначкою «Рекрутер-фрилансер». Менеджер розповість про вакансії, умови винагороди й навчання.' },
    ],
  },
  ru: {
    metaTitle: 'Сотрудничество — работники из Украины для работодателей и агентств',
    metaDescription: 'Подбираем работников из Украины для работодателей и агентств труда в ЕС: 65+ рекрутеров, 5 офисов, с 2018 года. Партнёрство для агентств и рекрутеров-фрилансеров.',
    crumb: 'Сотрудничество',
    home: 'Главная',
    eyebrow: 'Сотрудничество',
    h1: 'Закроем вашу вакансию кандидатами из Украины',
    sub: 'С 2018 года подбираем работников для работодателей и агентств труда в Европе. Открыты к партнёрству с агентствами из разных стран и рекрутерами-фрилансерами.',
    cta: 'Оставить заявку',
    langs: 'Эта страница на других языках:',
    stats: (vac, countries) => [
      [`${VOLUME.recruiters}+`, 'рекрутеров в наших офисах'],
      [`${num(VOLUME.perMonth, 'ru')}+`, 'кандидатов ежемесячно'],
      [`${num(VOLUME.perYear, 'ru')}+`, 'трудоустроенных ежегодно'],
      [String(countries), `стран, ${vac} открытых вакансий`],
    ],
    whoTitle: 'Кому мы полезны',
    who: [
      { kind: 'employer', title: 'Работодателям и агентствам труда в ЕС', text: () => 'Закроем любую позицию: склады, производство, стройка, отели и рестораны, водители, сельское хозяйство. Поиск, отбор, документы и доезд кандидатов — на нас.', cta: 'Нужны работники' },
      { kind: 'agency', title: 'Агентствам-партнёрам', text: () => 'Обмениваемся вакансиями и кандидатами с агентствами из разных стран. Совместные проекты на прозрачных партнёрских условиях.', cta: 'Стать партнёром' },
      { kind: 'freelancer', title: 'Рекрутерам-фрилансерам', text: (vac) => `Работайте с нашими ${vac} вакансиями из любого города: приводите кандидатов и получайте вознаграждение за тех, кто вышел на работу. Обучим и дадим координатора.`, cta: 'Присоединиться' },
    ],
    howTitle: 'Как мы закрываем вакансии',
    how: [
      ['Бриф', 'Обсуждаем позицию, условия, график и жильё, согласуем сроки.'],
      ['Поиск', `${VOLUME.recruiters}+ рекрутеров в ${VOLUME.offices} офисах и собственные онлайн-каналы.`],
      ['Отбор', 'Собеседование, проверка опыта и документов — к вам едут те, кто подходит.'],
      ['Документы и доезд', 'Помогаем с визами и разрешениями, билетами и маршрутом до места работы.'],
      ['Сопровождение', 'Координатор на связи с кандидатом и с вами — до выхода на работу и после.'],
    ],
    countriesTitle: 'Наши кандидаты работают в странах',
    trust: 'ООО «Европа Сервис Украина», ЕГРПОУ 42515343 · лицензия Минсоцполитики № 223 от 15.02.2019',
    formTitle: 'Расскажите о вашем запросе',
    formSub: 'Менеджер отдела партнёрства свяжется с вами. Или напишите нам на',
    faqTitle: 'Вопросы партнёров',
    faq: [
      { q: 'Какие позиции вы закрываете?', a: 'Рабочие и технические: склады и логистика, производство, пищевая промышленность, автозаводы, стройка, отели и рестораны, уборка, сельское хозяйство, водители. Под каждый запрос собираем отдельную команду рекрутеров.' },
      { q: 'Откуда ваши кандидаты?', a: `В основном из Украины: ${VOLUME.offices} наших офисов (Киев, Львов, Ровно, Житомир, Одесса) и собственные онлайн-каналы. Кандидаты проходят собеседование и проверку документов до выезда.` },
      { q: 'Как стать рекрутером-фрилансером?', a: 'Оставьте заявку с отметкой «Рекрутер-фрилансер». Менеджер расскажет о вакансиях, условиях вознаграждения и обучении.' },
    ],
  },
  en: {
    // Tilda's /cooperation: <title> «Cooperation Europe Service», H1 «Our performance» (kept one-to-one)
    metaTitle: 'Cooperation Europe Service',
    metaDescription: 'Europe Service recruits workers from Ukraine for employers and labour agencies in the EU: 65+ recruiters, 5 offices, since 2018. Partnership for agencies and freelance recruiters.',
    crumb: 'Cooperation',
    home: 'Home',
    eyebrow: 'Cooperation',
    h1: 'Workers from Ukraine for your business',
    tildaH1: 'Our performance',
    sub: 'Since 2018 we have been recruiting staff for employers and labour agencies across Europe. We are open to partnerships with agencies from any country and with freelance recruiters.',
    cta: 'Send a request',
    langs: 'This page in other languages:',
    stats: (vac, countries) => [
      [`${VOLUME.recruiters}+`, 'recruiters in our offices'],
      [`${num(VOLUME.perMonth, 'en')}+`, 'candidates every month'],
      [`${num(VOLUME.perYear, 'en')}+`, 'people placed every year'],
      [String(countries), `countries, ${vac} open vacancies`],
    ],
    whoTitle: 'Who we work with',
    who: [
      { kind: 'employer', title: 'Employers and labour agencies in the EU', text: () => 'We fill any position: warehouses, production, construction, hotels and restaurants, drivers, agriculture. Sourcing, screening, documents and travel to the workplace are on us.', cta: 'I need workers' },
      { kind: 'agency', title: 'Partner agencies', text: () => 'We exchange vacancies and candidates with agencies from different countries — joint projects on transparent partner terms.', cta: 'Become a partner' },
      { kind: 'freelancer', title: 'Freelance recruiters', text: (vac) => `Work with our ${vac} vacancies from anywhere: bring candidates and get a reward for everyone who starts work. We train you and give you a coordinator.`, cta: 'Join us' },
    ],
    howTitle: 'How we fill vacancies',
    how: [
      ['Brief', 'We agree on the position, terms, schedule, housing and timing.'],
      ['Sourcing', `${VOLUME.recruiters}+ recruiters in ${VOLUME.offices} offices and our own online channels.`],
      ['Screening', 'Interview, experience and document checks — only suitable candidates travel to you.'],
      ['Documents & travel', 'We help with visas and permits, tickets and the route to the workplace.'],
      ['Support', 'A coordinator stays in touch with the candidate and with you — before and after the start.'],
    ],
    countriesTitle: 'Our candidates work in',
    trust: 'Europe Service Ukraine LLC, EDRPOU 42515343 · licence of the Ministry of Social Policy of Ukraine № 223 of 15.02.2019',
    formTitle: 'Tell us about your request',
    formSub: 'Our partnership manager will get back to you. Or email us at',
    faqTitle: 'Questions from partners',
    faq: [
      { q: 'Which positions do you fill?', a: 'Blue-collar and technical roles: warehouses and logistics, production, food industry, car plants, construction, hotels and restaurants, cleaning, agriculture, drivers. A dedicated team of recruiters works on every request.' },
      { q: 'Where do your candidates come from?', a: `Mostly from Ukraine: our ${VOLUME.offices} offices (Kyiv, Lviv, Rivne, Zhytomyr, Odesa) and our own online channels. Every candidate is interviewed and has documents checked before departure.` },
      { q: 'How do I become a freelance recruiter?', a: 'Send a request and choose «Freelance recruiter». A manager will tell you about the vacancies, the reward terms and the training.' },
    ],
  },
  pl: {
    metaTitle: 'Współpraca — pracownicy z Ukrainy dla pracodawców i agencji',
    metaDescription: 'Europe Service rekrutuje pracowników z Ukrainy dla pracodawców i agencji pracy w UE: 65+ rekruterów, 5 biur, od 2018 roku. Partnerstwo dla agencji i rekruterów freelancerów.',
    crumb: 'Współpraca',
    home: 'Strona główna',
    eyebrow: 'Współpraca',
    h1: 'Pracownicy z Ukrainy dla Twojej firmy',
    sub: 'Od 2018 roku rekrutujemy pracowników dla pracodawców i agencji pracy w Europie. Jesteśmy otwarci na współpracę z agencjami z różnych krajów i rekruterami freelancerami.',
    cta: 'Wyślij zapytanie',
    langs: 'Ta strona w innych językach:',
    stats: (vac, countries) => [
      [`${VOLUME.recruiters}+`, 'rekruterów w naszych biurach'],
      [`${num(VOLUME.perMonth, 'pl')}+`, 'kandydatów miesięcznie'],
      [`${num(VOLUME.perYear, 'pl')}+`, 'zatrudnionych rocznie'],
      [String(countries), `krajów, ${vac} otwartych ofert`],
    ],
    whoTitle: 'Dla kogo pracujemy',
    who: [
      { kind: 'employer', title: 'Pracodawcom i agencjom pracy w UE', text: () => 'Obsadzimy każde stanowisko: magazyny, produkcja, budownictwo, hotele i restauracje, kierowcy, rolnictwo. Wyszukanie, selekcja, dokumenty i dojazd kandydatów — po naszej stronie.', cta: 'Potrzebuję pracowników' },
      { kind: 'agency', title: 'Agencjom partnerskim', text: () => 'Wymieniamy się ofertami i kandydatami z agencjami z różnych krajów — wspólne projekty na przejrzystych warunkach partnerskich.', cta: 'Zostań partnerem' },
      { kind: 'freelancer', title: 'Rekruterom freelancerom', text: (vac) => `Pracuj z naszymi ${vac} ofertami z dowolnego miejsca: poleć kandydatów i otrzymuj wynagrodzenie za każdego, kto rozpoczął pracę. Przeszkolimy Cię i damy koordynatora.`, cta: 'Dołącz' },
    ],
    howTitle: 'Jak obsadzamy wakaty',
    how: [
      ['Brief', 'Ustalamy stanowisko, warunki, grafik, zakwaterowanie i terminy.'],
      ['Wyszukanie', `${VOLUME.recruiters}+ rekruterów w ${VOLUME.offices} biurach i własne kanały online.`],
      ['Selekcja', 'Rozmowa, weryfikacja doświadczenia i dokumentów — przyjeżdżają odpowiedni kandydaci.'],
      ['Dokumenty i dojazd', 'Pomagamy z wizami i zezwoleniami, biletami i trasą do miejsca pracy.'],
      ['Opieka', 'Koordynator jest w kontakcie z kandydatem i z Tobą — przed rozpoczęciem pracy i po.'],
    ],
    countriesTitle: 'Nasi kandydaci pracują w krajach',
    trust: 'Europe Service Ukraine LLC, EDRPOU 42515343 · licencja Ministerstwa Polityki Społecznej Ukrainy nr 223 z 15.02.2019',
    formTitle: 'Opowiedz nam o swoim zapytaniu',
    formSub: 'Menedżer ds. współpracy skontaktuje się z Tobą. Możesz też napisać na',
    faqTitle: 'Pytania partnerów',
    faq: [
      { q: 'Jakie stanowiska obsadzacie?', a: 'Stanowiska fizyczne i techniczne: magazyny i logistyka, produkcja, przemysł spożywczy, fabryki samochodów, budownictwo, hotele i restauracje, sprzątanie, rolnictwo, kierowcy. Do każdego zapytania tworzymy osobny zespół rekruterów.' },
      { q: 'Skąd pochodzą wasi kandydaci?', a: `Głównie z Ukrainy: nasze ${VOLUME.offices} biur (Kijów, Lwów, Równe, Żytomierz, Odessa) i własne kanały online. Każdy kandydat przechodzi rozmowę i weryfikację dokumentów przed wyjazdem.` },
      { q: 'Jak zostać rekruterem freelancerem?', a: 'Wyślij zapytanie i wybierz «Rekruter freelancer». Menedżer opowie o ofertach, warunkach wynagrodzenia i szkoleniu.' },
    ],
  },
}

/** country names in the four languages (the site's own list is uk/ru only) */
export const COUNTRY_NAMES: Record<string, { en: string; pl: string }> = {
  pl: { en: 'Poland', pl: 'Polska' },
  de: { en: 'Germany', pl: 'Niemcy' },
  cz: { en: 'Czechia', pl: 'Czechy' },
  lt: { en: 'Lithuania', pl: 'Litwa' },
  nl: { en: 'Netherlands', pl: 'Holandia' },
  sk: { en: 'Slovakia', pl: 'Słowacja' },
  ro: { en: 'Romania', pl: 'Rumunia' },
  hu: { en: 'Hungary', pl: 'Węgry' },
  gr: { en: 'Greece', pl: 'Grecja' },
  it: { en: 'Italy', pl: 'Włochy' },
  be: { en: 'Belgium', pl: 'Belgia' },
  lv: { en: 'Latvia', pl: 'Łotwa' },
  at: { en: 'Austria', pl: 'Austria' },
  gb: { en: 'United Kingdom', pl: 'Wielka Brytania' },
  uk: { en: 'United Kingdom', pl: 'Wielka Brytania' },
  fr: { en: 'France', pl: 'Francja' },
  ca: { en: 'Canada', pl: 'Kanada' },
}
