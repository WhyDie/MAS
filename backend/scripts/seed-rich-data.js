const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.resolve(__dirname, '../military_system.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function uuid() {
  return crypto.randomUUID();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const units = [
  {
    id: 'unit-alpha-00000000-0000-0000-0000-000000000001',
    name: '2-й гірсько-штурмовий батальйон',
    inviteCode: 'ALPHA-INVITE-2026',
  },
  {
    id: 'unit-bravo-00000000-0000-0000-0000-000000000002',
    name: '3-й механізований батальйон',
    inviteCode: 'BRAVO-INVITE-2026',
  },
  {
    id: 'unit-charlie-00000000-0000-0000-0000-000000000003',
    name: '9-та тактична група',
    inviteCode: 'CHARLIE-INVITE-2026',
  },
];

const users = [
  {
    id: 'user-commander-alpha-0000000000001',
    email: 'kovalenko@army.local',
    password: 'Commander123!',
    firstName: 'Олег',
    lastName: 'Коваленко',
    middleName: 'Володимирович',
    birthDate: '1985-03-10',
    serviceStartDate: '2003-09-01',
    contractEndDate: '2028-09-01',
    rank: 'Полковник',
    position: 'Командир частини',
    role: 'commander',
    unitId: units[0].id,
    currentStatus: 'active',
    callsign: 'Орел-10',
    weaponName: 'АК-74',
    weaponNumber: 'A-274-001',
    profilePictureUrl: null,
    preferences: { theme: 'light', notifications: true, language: 'uk' },
  },
  {
    id: 'user-commander-bravo-0000000000002',
    email: 'bondarenko@army.local',
    password: 'Commander123!',
    firstName: 'Іван',
    lastName: 'Бондаренко',
    middleName: 'Петрович',
    birthDate: '1986-07-18',
    serviceStartDate: '2004-09-01',
    contractEndDate: '2029-09-01',
    rank: 'Підполковник',
    position: 'Начальник штабу',
    role: 'commander',
    unitId: units[1].id,
    currentStatus: 'active',
    callsign: 'Сокіл-20',
    weaponName: 'АК-74',
    weaponNumber: 'A-274-002',
    profilePictureUrl: null,
    preferences: { theme: 'dark', notifications: true, language: 'uk' },
  },
  {
    id: 'user-mentor-0000000000003',
    email: 'tkachenko@army.local',
    password: 'Mentor123!',
    firstName: 'Михайло',
    lastName: 'Ткаченко',
    middleName: 'Сергійович',
    birthDate: '1990-02-20',
    serviceStartDate: '2010-09-01',
    contractEndDate: '2035-09-01',
    rank: 'Майор',
    position: 'Ментор з тактичної медицини',
    role: 'mentor',
    unitId: units[0].id,
    currentStatus: 'active',
    callsign: 'Медик-1',
    weaponName: 'АКС-74У',
    weaponNumber: 'A-274-003',
    profilePictureUrl: null,
    preferences: { theme: 'red-light', notifications: true, language: 'uk' },
  },
  {
    id: 'user-psychologist-0000000000004',
    email: 'lisenko@army.local',
    password: 'Psych123!',
    firstName: 'Олена',
    lastName: 'Лисенко',
    middleName: 'Романівна',
    birthDate: '1991-11-05',
    serviceStartDate: '2015-09-01',
    contractEndDate: '2040-09-01',
    rank: 'Капітан мед. служби',
    position: 'Психолог',
    role: 'psychologist',
    unitId: units[0].id,
    currentStatus: 'active',
    callsign: 'Спокій-1',
    weaponName: null,
    weaponNumber: null,
    profilePictureUrl: null,
    preferences: { theme: 'dark', notifications: true, language: 'uk' },
  },
  {
    id: 'user-recruit-0000000000005',
    email: 'ivan.petrenko@army.local',
    password: 'Recruit123!',
    firstName: 'Іван',
    lastName: 'Петренко',
    middleName: 'Олексійович',
    birthDate: '2002-05-12',
    serviceStartDate: '2024-08-01',
    contractEndDate: '2029-08-01',
    rank: 'Солдат',
    position: 'Новобранець',
    civilProfession: 'студент',
    role: 'recruit',
    unitId: units[0].id,
    currentStatus: 'active',
    callsign: 'Снайпер-5',
    weaponName: 'АК-74',
    weaponNumber: 'A-274-105',
    profilePictureUrl: null,
    preferences: { theme: 'light', notifications: true, language: 'uk' },
  },
  {
    id: 'user-recruit-0000000000006',
    email: 'oksana.kovalenko@army.local',
    password: 'Recruit123!',
    firstName: 'Оксана',
    lastName: 'Коваленко',
    middleName: 'Михайлівна',
    birthDate: '2003-09-07',
    serviceStartDate: '2024-08-01',
    contractEndDate: '2029-08-01',
    rank: 'Солдат',
    position: 'Новобранка',
    civilProfession: 'інженер',
    role: 'recruit',
    unitId: units[1].id,
    currentStatus: 'active',
    callsign: 'Ватажок-3',
    weaponName: 'АК-74',
    weaponNumber: 'A-274-106',
    profilePictureUrl: null,
    preferences: { theme: 'light', notifications: false, language: 'uk' },
  },
  {
    id: 'user-admin-0000000000007',
    email: 'admin@army.local',
    password: 'Admin123!',
    firstName: 'Андрій',
    lastName: 'Шевченко',
    middleName: 'Олексійович',
    birthDate: '1988-01-20',
    serviceStartDate: '2008-09-01',
    contractEndDate: '2038-09-01',
    rank: 'Капітан',
    position: 'Системний адміністратор',
    role: 'admin',
    unitId: units[2].id,
    currentStatus: 'active',
    callsign: 'Технік-1',
    weaponName: null,
    weaponNumber: null,
    profilePictureUrl: null,
    preferences: { theme: 'dark', notifications: true, language: 'uk' },
  },
  {
    id: 'user-superadmin-0000000000008',
    email: 'godmode@army.local',
    password: 'GodMode123!',
    firstName: 'Супер',
    lastName: 'Адмін',
    middleName: '',
    birthDate: '1990-01-01',
    serviceStartDate: '2020-01-01',
    contractEndDate: '2040-01-01',
    rank: 'Полковник',
    position: 'Супер-адмін',
    role: 'superadmin',
    unitId: units[2].id,
    currentStatus: 'active',
    callsign: 'GODMODE',
    weaponName: null,
    weaponNumber: null,
    profilePictureUrl: null,
    preferences: { theme: 'light', notifications: true, language: 'uk' },
  },
];

const faqs = [
  {
    id: uuid(),
    category: 'Реєстрація',
    q: 'Як використати інвайт-код для реєстрації?',
    a: 'Введіть код у полі реєстрації. Якщо код дійсний, система створить аккаунт з роллю, закріпленою за кодом.',
  },
  {
    id: uuid(),
    category: 'Навчання',
    q: 'Як перейти до наступного модуля після завершення попереднього?',
    a: 'Після завершення модуля в профілі натисніть “Далі”, або знайдіть рекомендований модуль у вашій траєкторії.',
  },
  {
    id: uuid(),
    category: 'Психологічна підтримка',
    q: 'Чи можна залишити запит анонімно?',
    a: 'Так, ви можете надіслати запит анонімно — ваші персональні дані не будуть відкриті психологу.',
  },
  {
    id: uuid(),
    category: 'Менторство',
    q: 'Як обрати ментора за темою підготовки?',
    a: 'Оберіть тему у формі запиту. Система автоматично направить ваш запит до доступного ментора.',
  },
  {
    id: uuid(),
    category: 'Розклад',
    q: 'Де зберігається щоденний графік підрозділу?',
    a: 'Розклад доступний у розділі “Розклад” за вашим підрозділом. Ви бачите всі майбутні тренування, прийоми і чергування.',
  },
];

const announcements = [
  {
    id: uuid(),
    title: 'Нове оновлення програми доступне',
    text: 'Встановлено оновлення з новими тренувальними модулями, віджетами та покращеним розкладом.',
    type: 'system',
    author: 'Система',
  },
  {
    id: uuid(),
    title: 'Планові тренування з тактичної медицини',
    text: 'Завтра о 09:00 у навчальному класі відбудеться заняття з тактичної медицини. Явка обовʼязкова.',
    type: 'training',
    author: 'Командування',
  },
  {
    id: uuid(),
    title: 'Години роботи медпункту',
    text: 'Медпункт працює щоденно 08:00-18:00. В екстрених випадках звертайтесь до чергового.',
    type: 'medical',
    author: 'Медслужба',
  },
  {
    id: uuid(),
    title: 'Нова психологічна підтримка',
    text: 'У вашому підрозділі доступна додаткова психологічна сесія. Запис відкрито у розділі “Підтримка”.',
    type: 'support',
    author: 'Психологічна служба',
  },
];

const newModules = [
  {
    id: 'module-tactical-medicine-0000000001',
    title: 'Розширена тактична медицина: турнікети, евакуація та перша допомога',
    description: 'Поглиблений курс з надання першої допомоги в бою, евакуації поранених та тактичної поведінки.',
    category: 'Тактична Медицина',
    difficulty: 'advanced',
    durationMinutes: 90,
    tags: JSON.stringify(['медицина', 'евакуація', 'турнікет', 'TCCC']),
    isOfflineAvailable: 1,
    viewCount: 0,
    sortOrder: 10,
    isActive: 1,
    content: JSON.stringify({
      text: 'Цей курс дає практичні навички з турнікетування, зупинки кровотечі, стабілізації та підготовки до MEDEVAC.',
      steps: [
        { title: 'Турнікет: правила накладання', description: 'Накладається вище місця поранення, фіксується час, не знімається до супроводу медиків.' },
        { title: 'Оклюзійні повʼязки при пневмотораксі', description: 'Закрийте рану з трьома сторонами, залишивши одну відкритою для виходу повітря.' },
        { title: 'Підготовка до евакуації', description: 'Заповніть карту пораненого, тримайте руки сухими, зафіксуйте найближчі поля.' },
      ],
    }),
  },
  {
    id: 'module-urban-patrol-0000000002',
    title: 'Патрулювання у місті: орієнтування, безпека, звʼязок',
    description: 'Основи руху в урбанізованій зоні, робота групи, використання радіозвʼязку та виявлення ризиків.',
    category: 'Тактика',
    difficulty: 'intermediate',
    durationMinutes: 75,
    tags: JSON.stringify(['місто', 'патруль', 'звʼязок', 'РЕБ']),
    isOfflineAvailable: 1,
    viewCount: 0,
    sortOrder: 11,
    isActive: 1,
    content: JSON.stringify({
      text: 'Урбаністичні умови вимагають нових підходів до руху та маскування. Цей курс показує стандартні процедури для групи.',
      steps: [
        { title: 'Вхід та вихід із будівлі', description: 'Перевірка кімнати, порядок руху, безпечні коридори.' },
        { title: 'Радіозвʼязок у місті', description: 'Використовуйте короткі фрази, резервні частоти, перевіряйте позивні.' },
        { title: 'Оцінка ризиків та схованок', description: 'Шукайте відкриті вікна, дах, доступ на пагорби. Не залишайте відкриті задні фасади.' },
      ],
    }),
  },
  {
    id: 'module-communication-security-0000000003',
    title: 'Цифрова безпека звʼязку та захист від РЕБ',
    description: 'Навчальний модуль з правил радіозвʼязку, ботів та зменшення радіоемісії під час операцій.',
    category: 'Звʼязок',
    difficulty: 'intermediate',
    durationMinutes: 60,
    tags: JSON.stringify(['звʼязок', 'РЕБ', 'безпека', 'радіо']),
    isOfflineAvailable: 1,
    viewCount: 0,
    sortOrder: 12,
    isActive: 1,
    content: JSON.stringify({
      text: 'Курс з мінімізації цифрового сліду, роботи з раціями та правил поведінки під час виявлення електронного впливу.',
      steps: [
        { title: 'Переходи в авіарежим', description: 'Вимикайте Wi-Fi, Bluetooth і GPS перед выїздом на позицію.' },
        { title: 'Ротація позивних', description: 'Використовуйте змінні позивні та короткі повідомлення.' },
        { title: 'Захист від радіоперехоплення', description: 'Не передавайте інформацію, яка може розкрити місцезнаходження або завдання.' },
      ],
    }),
  },
];

const scheduleEvents = [
  {
    id: uuid(),
    unitId: units[0].id,
    title: 'Тактичне заняття: MARCH та евакуація поранених',
    description: 'Практичне заняття з тактичної медицини у тренувальному класі.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString().replace('T', ' ').substring(0, 19),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString().replace('T', ' ').substring(0, 19),
    eventType: 'training',
    location: 'Навчальний клас 215',
    assignedUserIds: JSON.stringify([users[0].id, users[2].id, users[4].id]),
    status: 'scheduled',
    notifyParticipants: 1,
  },
  {
    id: uuid(),
    unitId: units[1].id,
    title: 'Стрілецький тренінг у тирі',
    description: 'Тренування з поводження з АК-74 та робота зі зброєю.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString().replace('T', ' ').substring(0, 19),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString().replace('T', ' ').substring(0, 19),
    eventType: 'training',
    location: 'Тир',
    assignedUserIds: JSON.stringify([users[1].id, users[5].id]),
    status: 'scheduled',
    notifyParticipants: 1,
  },
  {
    id: uuid(),
    unitId: units[0].id,
    title: 'Медичний огляд і вакцинація',
    description: 'Перевірка здоровʼя всього особового складу.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString().replace('T', ' ').substring(0, 19),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 31).toISOString().replace('T', ' ').substring(0, 19),
    eventType: 'medical',
    location: 'Медпункт 102',
    assignedUserIds: JSON.stringify([users[0].id, users[3].id, users[4].id]),
    status: 'scheduled',
    notifyParticipants: 1,
  },
  {
    id: uuid(),
    unitId: units[2].id,
    title: 'Оперативна нарада командирів',
    description: 'Обговорення плану дій на тиждень.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString().replace('T', ' ').substring(0, 19),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString().replace('T', ' ').substring(0, 19),
    eventType: 'meeting',
    location: 'Кабінет командира 201',
    assignedUserIds: JSON.stringify([users[0].id, users[1].id, users[6].id]),
    status: 'scheduled',
    notifyParticipants: 1,
  },
  {
    id: uuid(),
    unitId: units[1].id,
    title: 'Чергування у наряді',
    description: 'Наряд на КПП з 20:00 до 24:00.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString().replace('T', ' ').substring(0, 19),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString().replace('T', ' ').substring(0, 19),
    eventType: 'duty',
    location: 'КПП',
    assignedUserIds: JSON.stringify([users[5].id]),
    status: 'scheduled',
    notifyParticipants: 1,
  },
];

const notifications = [
  {
    id: uuid(),
    userId: users[4].id,
    title: 'Ваш тренінг розпочинається за 2 години',
    message: 'Перевірте підготовку до заняття з тактичної медицини у навчальному класі.',
    type: 'schedule',
    isRead: 0,
  },
  {
    id: uuid(),
    userId: users[5].id,
    title: 'Запит на менторство отримано',
    message: 'Ваш запит щодо роботи з радіозвʼязком оброблено ментором.',
    type: 'mentorship',
    isRead: 0,
  },
  {
    id: uuid(),
    userId: users[4].id,
    title: 'Психологічна підтримка доступна',
    message: 'Ви можете надіслати анонімний запит до психолога або записатися на зустріч.',
    type: 'psychology',
    isRead: 0,
  },
  {
    id: uuid(),
    userId: users[6].id,
    title: 'Нове системне повідомлення',
    message: 'Створено нову частину та додано користувачів до навчального курсу.',
    type: 'system',
    isRead: 0,
  },
];

const mentorshipRequests = [
  {
    id: uuid(),
    recruitId: users[4].id,
    mentorId: users[2].id,
    topic: 'tactical_medicine',
    description: 'Потрібна допомога з накладанням турнікету та евакуацією пораненого у полі бою.',
    skills: JSON.stringify(['турнікет', 'евакуація', 'перша допомога']),
    requiredSkills: JSON.stringify(['анатомія', 'швидке прийняття рішення']),
    status: 'accepted',
    response: 'Почнемо з базових алгоритмів MARCH у пʼятницю о 09:00.',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString().replace('T', ' ').substring(0, 19),
    completedAt: null,
    feedback: JSON.stringify({ mentorRating: 5, recruiteRating: 4, comments: 'Дуже корисно, треба більше практики.' }),
    rating: 5,
    isAnonymous: false,
  },
  {
    id: uuid(),
    recruitId: users[5].id,
    mentorId: users[2].id,
    topic: 'communications',
    description: 'Потрібна консультація з радіозвʼязком та стандартами SALUTE / MEDEVAC.',
    skills: JSON.stringify(['звʼязок', 'процедури', 'безпека']),
    requiredSkills: JSON.stringify(['фонетичний алфавіт', 'рація']),
    status: 'pending',
    isAnonymous: true,
  },
];

const psychologicalSupportEntries = [
  {
    id: uuid(),
    userId: users[4].id,
    contactType: 'identified',
    message: 'Почуваю себе напруженим перед першим виїздом на полігон. Хочу поговорити з психологом.',
    psychologistId: users[3].id,
    response: 'Можемо обговорити техніки контролю стресу. Зустрінемось о 17:00.',
    respondedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString().replace('T', ' ').substring(0, 19),
    respondedByUserId: users[3].id,
    status: 'responded',
    severity: 'medium',
    keywords: JSON.stringify(['стрес', 'перед виїздом', 'підтримка']),
    isEscalated: 0,
  },
  {
    id: uuid(),
    userId: users[5].id,
    contactType: 'anonymous',
    message: 'Потрібна порада, як справлятись з втомою та тривожністю в умовах служби.',
    status: 'pending',
    severity: 'medium',
    keywords: JSON.stringify(['тривожність', 'втома']),
    isEscalated: 0,
  },
];

const equipments = [
  {
    id: uuid(),
    userId: users[4].id,
    name: 'Тактичний рюкзак',
    description: 'Водовідштовхувальний рюкзак для польових виходів.',
    weight: 3.5,
    cost: 4500.0,
    type: 'issued',
    category: 'спорядження',
    purchaseDate: '2024-08-01 10:00:00',
    manufacturer: 'УкрТех',
    serialNumber: 'TK-2024-0001',
  },
  {
    id: uuid(),
    userId: users[4].id,
    name: 'Індивідуальна аптечка',
    description: 'Набір першої допомоги з турнікетом, бинтами та антисептиком.',
    weight: 1.2,
    cost: 1800.0,
    type: 'issued',
    category: 'медицина',
    purchaseDate: '2024-08-01 10:00:00',
    manufacturer: 'MedPack',
    serialNumber: 'MP-1005',
  },
  {
    id: uuid(),
    userId: users[5].id,
    name: 'Шолом БАРС',
    description: 'Захисний шолом зі внутрішнім протектором.',
    weight: 1.8,
    cost: 5200.0,
    type: 'issued',
    category: 'захист',
    purchaseDate: '2024-08-01 09:30:00',
    manufacturer: 'ArmTech',
    serialNumber: 'BAR-3421',
  },
  {
    id: uuid(),
    userId: users[2].id,
    name: 'Автомат АКС-74У',
    description: 'Особистий автомат ментора з набором для навчальних стрільб.',
    weight: 3.6,
    cost: 15000.0,
    type: 'issued',
    category: 'зброя',
    purchaseDate: '2023-03-18 13:00:00',
    manufacturer: 'ІЖ',
    serialNumber: 'AKS-74U-4510',
  },
];

const userOnboardings = [
  {
    id: uuid(),
    userId: users[4].id,
    profileAnswers: JSON.stringify({
      militaryExperience: 'none',
      education: 'бакалавр компʼютерних наук',
      specialization: 'керування дронами',
      physicalFitness: 7,
      concerns: ['стрес', 'нічні дежурства'],
      skills: ['компʼютерна грамотність', 'аналітичне мислення'],
      preferredLearning: 'mixed',
      mentorPreference: true,
      nightShiftExperience: false,
    }),
    generatedTrajectory: JSON.stringify({
      trajectory: ['Основи безпеки', 'Тактична медицина', 'Радіозвʼязок', 'Польові вправи'],
      estimatedDuration: 6,
      difficulty: 'нормально',
      roadmap: [
        { week: 1, title: 'Ознайомлення з частиною', modules: ['module-urban-patrol-0000000002', 'module-communication-security-0000000003'], goals: ['ознайомитися з правилами', 'навчитися безпечному руху'], milestones: ['реєстрація', 'медичний огляд'] },
        { week: 2, title: 'Основи тактичної медицини', modules: ['module-tactical-medicine-0000000001'], goals: ['вивчити MARCH', 'навчитися турнікетуванню'], milestones: ['практичне заняття'] },
      ],
      personalRecommendations: ['переглянути відео про турнікети', 'повторити правила радіозвʼязку'],
    }),
    progress: JSON.stringify({ week: 1, completedModules: 2, totalModules: 4, score: 78 }),
    isCompleted: 0,
  },
  {
    id: uuid(),
    userId: users[5].id,
    profileAnswers: JSON.stringify({
      militaryExperience: 'conscript',
      education: 'медсестра',
      specialization: 'санітарія',
      physicalFitness: 8,
      concerns: ['складні тренування', 'психологічна витривалість'],
      skills: ['медична допомога', 'організація'],
      preferredLearning: 'practical',
      mentorPreference: true,
      nightShiftExperience: true,
    }),
    generatedTrajectory: JSON.stringify({
      trajectory: ['Тактична медицина', 'Організація чергувань', 'Медіація'],
      estimatedDuration: 8,
      difficulty: 'складно',
      roadmap: [
        { week: 1, title: 'Вступ до медичної підготовки', modules: ['module-tactical-medicine-0000000001'], goals: ['опанувати першу допомогу'], milestones: ['практичне заняття'] },
        { week: 2, title: 'Робота з військовою технікою', modules: ['module-urban-patrol-0000000002'], goals: ['вивчити навігацію', 'планування руху'], milestones: ['охоплення частини'] },
      ],
      personalRecommendations: ['вести журнал тренувань', 'працювати над витривалістю'],
    }),
    progress: JSON.stringify({ week: 1, completedModules: 1, totalModules: 3, score: 63 }),
    isCompleted: 0,
  },
];

const userProgressRecords = [
  {
    id: uuid(),
    userId: users[4].id,
    moduleId: newModules[0].id,
    completionPercentage: 85,
    score: 88,
    isCompleted: 1,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString().replace('T', ' ').substring(0, 19),
    attemptCount: 1,
    answers: JSON.stringify({ correct: 22, wrong: 3 }),
  },
  {
    id: uuid(),
    userId: users[4].id,
    moduleId: newModules[1].id,
    completionPercentage: 65,
    score: 72,
    isCompleted: 0,
    attemptCount: 1,
    answers: JSON.stringify({ section: 'orientation', correct: 5, wrong: 2 }),
  },
  {
    id: uuid(),
    userId: users[5].id,
    moduleId: newModules[2].id,
    completionPercentage: 90,
    score: 95,
    isCompleted: 1,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString().replace('T', ' ').substring(0, 19),
    attemptCount: 1,
    answers: JSON.stringify({ correct: 28, wrong: 2 }),
  },
];

const unitJoinRequests = [
  {
    id: uuid(),
    unitId: units[0].id,
    userId: users[5].id,
    status: 'pending',
  },
];

try {
  const unitStmt = db.prepare('INSERT OR REPLACE INTO "military_units" ("id", "name", "commanderId", "inviteCode", "createdAt") VALUES (?, ?, ?, ?, ?)');
  const userStmt = db.prepare(`INSERT OR REPLACE INTO "users" (
    "id", "email", "passwordHash", "firstName", "lastName", "middleName", "birthDate", "serviceStartDate", "contractEndDate",
    "rank", "position", "civilProfession", "role", "unitId", "isActive", "lastLoginAt", "profilePictureUrl", "preferences",
    "offlineSyncData", "encryptedLocalKey", "createdAt", "updatedAt", "currentStatus", "callsign", "weaponName", "weaponNumber", "signature", "commanderNotes"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const faqStmt = db.prepare('INSERT OR REPLACE INTO "faq" ("id", "category", "q", "a", "createdAt") VALUES (?, ?, ?, ?, ?)');
  const announcementsStmt = db.prepare('INSERT OR REPLACE INTO "announcements" ("id", "title", "text", "type", "author", "createdAt") VALUES (?, ?, ?, ?, ?, ?)');

  const moduleStmt = db.prepare(`INSERT OR REPLACE INTO "training_modules" (
    "id", "title", "description", "category", "difficulty", "durationMinutes", "tags", "content", "isOfflineAvailable", "viewCount", "sortOrder", "isActive", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const scheduleStmt = db.prepare(`INSERT OR REPLACE INTO "schedule_events" (
    "id", "unitId", "title", "description", "startTime", "endTime", "eventType", "location", "assignedUserIds", "status", "notifyParticipants", "createdByUserId", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const notifStmt = db.prepare('INSERT OR REPLACE INTO "notifications" ("id", "userId", "title", "message", "type", "isRead", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)');

  const mentorshipStmt = db.prepare(`INSERT OR REPLACE INTO "mentorship_requests" (
    "id", "recruitId", "mentorId", "topic", "description", "skills", "requiredSkills", "status", "response", "respondedAt", "completedAt", "feedback", "rating", "isAnonymous", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const psychStmt = db.prepare(`INSERT OR REPLACE INTO "psychological_support" (
    "id", "userId", "contactType", "message", "psychologistId", "response", "respondedAt", "respondedByUserId", "status", "severity", "keywords", "isEscalated", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const equipStmt = db.prepare(`INSERT OR REPLACE INTO "equipment" (
    "id", "userId", "name", "description", "weight", "cost", "type", "category", "isActive", "purchaseDate", "expiryDate", "manufacturer", "serialNumber", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`);

  const onboardingStmt = db.prepare(`INSERT OR REPLACE INTO "user_onboarding" (
    "id", "user_id", "profileAnswers", "generatedTrajectory", "progress", "isCompleted", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const progressStmt = db.prepare(`INSERT OR REPLACE INTO "user_progress" (
    "id", "userId", "moduleId", "completionPercentage", "score", "isCompleted", "completedAt", "attemptCount", "answers", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const joinReqStmt = db.prepare('INSERT OR REPLACE INTO "unit_join_requests" ("id", "unitId", "userId", "status", "createdAt") VALUES (?, ?, ?, ?, ?)');

  const unitTxn = db.transaction((items) => {
    for (const item of items) {
      unitStmt.run(item.id, item.name, null, item.inviteCode, now);
    }
  });

  const userTxn = db.transaction((items) => {
    for (const item of items) {
      userStmt.run(
        item.id,
        item.email,
        hashPassword(item.password),
        item.firstName,
        item.lastName,
        item.middleName || null,
        item.birthDate,
        item.serviceStartDate,
        item.contractEndDate,
        item.rank || null,
        item.position || null,
        item.civilProfession || null,
        item.role,
        item.unitId || null,
        1,
        now,
        item.profilePictureUrl || null,
        JSON.stringify(item.preferences || {}),
        null,
        null,
        now,
        now,
        item.currentStatus || null,
        item.callsign || null,
        item.weaponName || null,
        item.weaponNumber || null,
        null,
        null
      );
    }
  });

  const faqTxn = db.transaction((items) => {
    for (const item of items) {
      faqStmt.run(item.id, item.category, item.q, item.a, now);
    }
  });

  const annTxn = db.transaction((items) => {
    for (const item of items) {
      announcementsStmt.run(item.id, item.title, item.text, item.type, item.author, now);
    }
  });

  const modulesTxn = db.transaction((items) => {
    for (const item of items) {
      moduleStmt.run(
        item.id,
        item.title,
        item.description,
        item.category,
        item.difficulty,
        item.durationMinutes,
        item.tags,
        item.content,
        item.isOfflineAvailable,
        item.viewCount,
        item.sortOrder,
        item.isActive,
        now,
        now
      );
    }
  });

  const scheduleTxn = db.transaction((items) => {
    for (const item of items) {
      scheduleStmt.run(
        item.id,
        item.unitId,
        item.title,
        item.description,
        item.startTime,
        item.endTime,
        item.eventType,
        item.location,
        item.assignedUserIds,
        item.status,
        item.notifyParticipants,
        users[0].id,
        now,
        now
      );
    }
  });

  const notifTxn = db.transaction((items) => {
    for (const item of items) {
      notifStmt.run(item.id, item.userId, item.title, item.message, item.type, item.isRead, now);
    }
  });

  const mentorshipTxn = db.transaction((items) => {
    for (const item of items) {
      mentorshipStmt.run(
        item.id,
        item.recruitId,
        item.mentorId || null,
        item.topic,
        item.description,
        item.skills || null,
        item.requiredSkills || null,
        item.status,
        item.response || null,
        item.respondedAt || null,
        item.completedAt || null,
        item.feedback || null,
        item.rating || null,
        item.isAnonymous ? 1 : 0,
        now,
        now
      );
    }
  });

  const psychTxn = db.transaction((items) => {
    for (const item of items) {
      psychStmt.run(
        item.id,
        item.userId,
        item.contactType,
        item.message,
        item.psychologistId || null,
        item.response || null,
        item.respondedAt || null,
        item.respondedByUserId || null,
        item.status,
        item.severity,
        item.keywords || null,
        item.isEscalated ? 1 : 0,
        now,
        now
      );
    }
  });

  const equipTxn = db.transaction((items) => {
    for (const item of items) {
      equipStmt.run(
        item.id,
        item.userId,
        item.name,
        item.description || null,
        item.weight || null,
        item.cost || null,
        item.type,
        item.category,
        item.purchaseDate || null,
        item.expiryDate || null,
        item.manufacturer || null,
        item.serialNumber || null,
        now,
        now
      );
    }
  });

  const onboardingTxn = db.transaction((items) => {
    for (const item of items) {
      onboardingStmt.run(item.id, item.userId, item.profileAnswers, item.generatedTrajectory, item.progress, item.isCompleted ? 1 : 0, now, now);
    }
  });

  const progressTxn = db.transaction((items) => {
    for (const item of items) {
      progressStmt.run(item.id, item.userId, item.moduleId, item.completionPercentage, item.score, item.isCompleted ? 1 : 0, item.completedAt || null, item.attemptCount, item.answers || null, now, now);
    }
  });

  const joinReqTxn = db.transaction((items) => {
    for (const item of items) {
      joinReqStmt.run(item.id, item.unitId, item.userId, item.status, now);
    }
  });

  unitTxn(units);
  userTxn(users);
  faqTxn(faqs);
  annTxn(announcements);
  modulesTxn(newModules);
  scheduleTxn(scheduleEvents);
  notifTxn(notifications);
  mentorshipTxn(mentorshipRequests);
  psychTxn(psychologicalSupportEntries);
  equipTxn(equipments);
  onboardingTxn(userOnboardings);
  progressTxn(userProgressRecords);
  joinReqTxn(unitJoinRequests);

  // Update units with actual commanders after users are inserted.
  const updateUnitStmt = db.prepare('UPDATE "military_units" SET "commanderId" = ? WHERE "id" = ?');
  updateUnitStmt.run(users[0].id, units[0].id);
  updateUnitStmt.run(users[1].id, units[1].id);

  console.log('✅ Успішно додано релевантні тестові дані до бази military_system.db');
  console.log('🔐 Тестові паролі для логіну:');
  console.log('  commander:', 'Commander123!');
  console.log('  mentor:', 'Mentor123!');
  console.log('  psychologist:', 'Psych123!');
  console.log('  recruit:', 'Recruit123!');
  console.log('  admin:', 'Admin123!');
  console.log('  superadmin:', 'GodMode123!');
  console.log('📦 Тепер можна запускати бекенд та перевіряти дані в інтерфейсі.');
} catch (err) {
  console.error('❌ Помилка seed-скрипту:', err.message);
} finally {
  db.close();
}
