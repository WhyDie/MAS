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

function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function randomFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ensureTable(sql) {
  try {
    db.prepare(sql).run();
  } catch (e) {
    console.warn('Schema ensure skipped:', e.message);
  }
}

function ensureColumn(table, column, definition) {
  try {
    db.prepare(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`).run();
  } catch (e) {
    // ignore if column exists
  }
}

const now = new Date();
const timestamp = formatDate(now);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "military_units" (
    "id" varchar PRIMARY KEY,
    "name" varchar NOT NULL,
    "commanderId" varchar,
    "inviteCode" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "users" (
    "id" varchar PRIMARY KEY,
    "email" varchar UNIQUE,
    "passwordHash" varchar,
    "firstName" varchar,
    "lastName" varchar,
    "rank" varchar,
    "position" varchar,
    "civilProfession" varchar,
    "role" varchar,
    "unitId" varchar,
    "isActive" boolean DEFAULT 1,
    "lastLoginAt" datetime,
    "profilePictureUrl" varchar,
    "preferences" text,
    "offlineSyncData" text,
    "encryptedLocalKey" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureColumn('users', 'middleName', 'varchar');
ensureColumn('users', 'currentStatus', 'varchar DEFAULT \'active\'');
ensureColumn('users', 'callsign', 'varchar');
ensureColumn('users', 'weaponName', 'varchar');
ensureColumn('users', 'weaponNumber', 'varchar');
ensureColumn('users', 'commanderNotes', 'text');
ensureColumn('notifications', 'link', 'varchar');
ensureColumn('notifications', 'severity', 'varchar');

ensureTable(`
  CREATE TABLE IF NOT EXISTS "faq" (
    "id" varchar PRIMARY KEY,
    "category" varchar,
    "q" text,
    "a" text,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "announcements" (
    "id" varchar PRIMARY KEY,
    "title" varchar,
    "text" text,
    "type" varchar,
    "author" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "notifications" (
    "id" varchar PRIMARY KEY,
    "userId" varchar,
    "title" varchar,
    "message" text,
    "isRead" boolean DEFAULT 0,
    "link" varchar,
    "type" varchar,
    "severity" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "user_equipment" (
    "id" varchar PRIMARY KEY,
    "userId" varchar NOT NULL,
    "name" varchar NOT NULL,
    "category" varchar NOT NULL,
    "weight" float DEFAULT 0,
    "type" varchar DEFAULT 'personal',
    "cost" float DEFAULT 0,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "psychological_support" (
    "id" varchar PRIMARY KEY,
    "userId" varchar,
    "message" text,
    "contactType" varchar DEFAULT 'anonymous',
    "psychologistId" varchar,
    "response" text,
    "respondedAt" datetime,
    "respondedByUserId" varchar,
    "status" varchar DEFAULT 'pending',
    "severity" varchar DEFAULT 'medium',
    "keywords" text,
    "isEscalated" boolean DEFAULT 0,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "mentorship_requests" (
    "id" varchar PRIMARY KEY,
    "recruitId" varchar,
    "mentorId" varchar,
    "topic" varchar,
    "description" text,
    "response" text,
    "status" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" datetime
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "unit_join_requests" (
    "id" varchar PRIMARY KEY,
    "unitId" varchar,
    "userId" varchar,
    "status" varchar DEFAULT 'pending',
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "training_modules" (
    "id" varchar PRIMARY KEY,
    "title" varchar,
    "description" text,
    "category" varchar,
    "difficulty" varchar,
    "durationMinutes" integer DEFAULT 0,
    "tags" text,
    "content" text,
    "isOfflineAvailable" boolean DEFAULT 1,
    "viewCount" integer DEFAULT 0,
    "sortOrder" integer DEFAULT 0,
    "isActive" boolean DEFAULT 1,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "schedule_events" (
    "id" varchar PRIMARY KEY,
    "unitId" varchar,
    "title" varchar,
    "description" text,
    "startTime" datetime,
    "endTime" datetime,
    "eventType" varchar,
    "location" varchar,
    "assignedUserIds" text,
    "status" varchar DEFAULT 'scheduled',
    "notifyParticipants" boolean DEFAULT 0,
    "createdByUserId" varchar,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "xt_user_progress" (
    "id" varchar PRIMARY KEY,
    "userId" varchar,
    "moduleId" varchar,
    "status" varchar,
    "progress" integer,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "user_progress" (
    "id" varchar PRIMARY KEY,
    "userId" varchar,
    "moduleId" varchar,
    "completionPercentage" integer DEFAULT 0,
    "score" integer DEFAULT 0,
    "isCompleted" boolean DEFAULT 0,
    "completedAt" datetime,
    "attemptCount" integer DEFAULT 0,
    "answers" text,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

ensureTable(`
  CREATE TABLE IF NOT EXISTS "user_onboarding" (
    "id" varchar PRIMARY KEY,
    "user_id" varchar,
    "profileAnswers" text,
    "generatedTrajectory" text,
    "progress" text,
    "isCompleted" boolean DEFAULT 0,
    "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
  )
`);

const units = [
  { id: 'unit-alpha-00000000-0000-0000-0000-000000000001', name: '2-й гірсько-штурмовий батальйон', inviteCode: 'ALPHA-INVITE-2026' },
  { id: 'unit-bravo-00000000-0000-0000-0000-000000000002', name: '3-й механізований батальйон', inviteCode: 'BRAVO-INVITE-2026' },
  { id: 'unit-charlie-00000000-0000-0000-0000-000000000003', name: '9-та тактична група', inviteCode: 'CHARLIE-INVITE-2026' },
  { id: 'unit-delta-00000000-0000-0000-0000-000000000004', name: '5-та розвідувальна рота', inviteCode: 'DELTA-INVITE-2026' },
  { id: 'unit-echo-00000000-0000-0000-0000-000000000005', name: '7-ма медична рота', inviteCode: 'ECHO-INVITE-2026' },
];

const coreUsers = [
  { id: 'user-commander-alpha-0000000000001', email: 'kovalenko@army.local', password: 'Commander123!', firstName: 'Олег', lastName: 'Коваленко', middleName: 'Володимирович', birthDate: '1985-03-10', serviceStartDate: '2003-09-01', contractEndDate: '2028-09-01', rank: 'Полковник', position: 'Командир частини', role: 'commander', unitId: units[0].id, currentStatus: 'active', callsign: 'Орел-10', weaponName: 'АК-74', weaponNumber: 'A-274-001', preferences: { theme: 'light', notifications: true, language: 'uk' } },
  { id: 'user-commander-bravo-0000000000002', email: 'bondarenko@army.local', password: 'Commander123!', firstName: 'Іван', lastName: 'Бондаренко', middleName: 'Петрович', birthDate: '1986-07-18', serviceStartDate: '2004-09-01', contractEndDate: '2029-09-01', rank: 'Підполковник', position: 'Начальник штабу', role: 'commander', unitId: units[1].id, currentStatus: 'active', callsign: 'Сокіл-20', weaponName: 'АК-74', weaponNumber: 'A-274-002', preferences: { theme: 'dark', notifications: true, language: 'uk' } },
  { id: 'user-mentor-0000000000003', email: 'tkachenko@army.local', password: 'Mentor123!', firstName: 'Михайло', lastName: 'Ткаченко', middleName: 'Сергійович', birthDate: '1990-02-20', serviceStartDate: '2010-09-01', contractEndDate: '2035-09-01', rank: 'Майор', position: 'Ментор з тактичної медицини', role: 'mentor', unitId: units[0].id, currentStatus: 'active', callsign: 'Медик-1', weaponName: 'АКС-74У', weaponNumber: 'A-274-003', preferences: { theme: 'dark', notifications: true, language: 'uk' } },
  { id: 'user-psychologist-0000000000004', email: 'lisenko@army.local', password: 'Psych123!', firstName: 'Олена', lastName: 'Лисенко', middleName: 'Романівна', birthDate: '1991-11-05', serviceStartDate: '2015-09-01', contractEndDate: '2040-09-01', rank: 'Капітан мед. служби', position: 'Психолог', role: 'psychologist', unitId: units[4].id, currentStatus: 'active', callsign: 'Спокій-1', weaponName: null, weaponNumber: null, preferences: { theme: 'dark', notifications: true, language: 'uk' } },
  { id: 'user-admin-0000000000007', email: 'admin@army.local', password: 'Admin123!', firstName: 'Андрій', lastName: 'Шевченко', middleName: 'Олексійович', birthDate: '1988-01-20', serviceStartDate: '2008-09-01', contractEndDate: '2038-09-01', rank: 'Капітан', position: 'Системний адміністратор', role: 'admin', unitId: units[2].id, currentStatus: 'active', callsign: 'Технік-1', weaponName: null, weaponNumber: null, preferences: { theme: 'dark', notifications: true, language: 'uk' } },
  { id: 'user-superadmin-0000000000008', email: 'godmode@army.local', password: 'GodMode123!', firstName: 'Супер', lastName: 'Адмін', middleName: '', birthDate: '1990-01-01', serviceStartDate: '2020-01-01', contractEndDate: '2040-01-01', rank: 'Полковник', position: 'Супер-адмін', role: 'superadmin', unitId: units[2].id, currentStatus: 'active', callsign: 'GODMODE', weaponName: null, weaponNumber: null, preferences: { theme: 'light', notifications: true, language: 'uk' } },
];

const nameSets = {
  firstNames: ['Богдан', 'Марина', 'Назар', 'Тетяна', 'Арсен', 'Софія', 'Владислав', 'Ірина', 'Микита', 'Вікторія', 'Руслан', 'Оксана', 'Степан', 'Карина', 'Дмитро', 'Людмила', 'Петро', 'Надія', 'Ярослав', 'Олена', 'Юрій', 'Анастасія', 'Сергій', 'Аліна', 'Олександр', 'Валентина', 'Максим', 'Ілона', 'Ростислав', 'Марія'],
  lastNames: ['Коваль', 'Петренко', 'Іваненко', 'Ткач', 'Шевченко', 'Мельник', 'Бондар', 'Грищенко', 'Кравець', 'Сидоренко', 'Поліщук', 'Лисенко', 'Демченко', 'Руденко', 'Мороз', 'Гайдук', 'Козак', 'Олійник', 'Гнатюк', 'Савченко', 'Мельничук', 'Бабенко', 'Білик', 'Коваленко', 'Федоренко', 'Ковтун', 'Литвин', 'Горбенко', 'Шаповал', 'Захарченко'],
};

const generatedUsers = Array.from({ length: 54 }, (_, index) => {
  const firstName = randomFrom(nameSets.firstNames);
  const lastName = randomFrom(nameSets.lastNames);
  const role = randomFrom(['recruit', 'mentor', 'psychologist', 'admin']);
  const unitId = randomFrom(units).id;
  const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@army.local`;
  const rank = randomFrom(['Солдат', 'Старший солдат', 'Сержант', 'Старший сержант', 'Лейтенант', 'Капітан']);
  const positions = {
    recruit: 'Новобранець',
    mentor: 'Ментор',
    psychologist: 'Психолог',
    admin: 'Технік частини',
  };

  return {
    id: `user-gen-${String(index + 1).padStart(4, '0')}`,
    email: baseEmail,
    password: 'Password123!',
    firstName,
    lastName,
    middleName: randomFrom(['Олексійович', 'Петрівна', 'Сергійович', 'Анатоліївна', 'Вікторович', 'Григорівна', 'Миколайович', 'Ігорівна', 'Олександрівна', 'Романівна']),
    birthDate: `19${randomInt(85, 99)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    serviceStartDate: `20${randomInt(10, 23)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    contractEndDate: `2029-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    rank,
    position: positions[role],
    role,
    unitId,
    currentStatus: randomFrom(['active', 'inactive', 'on_leave']),
    callsign: `${randomFrom(['Ворон', 'Сокіл', 'Тигр', 'Беркут', 'Лис', 'Лев'])}-${randomInt(1, 99)}`,
    weaponName: role === 'recruit' ? randomFrom(['АК-74', 'АКС-74У', 'Пістолет ПМ', 'РПГ-7']) : null,
    weaponNumber: role === 'recruit' ? `A-${randomInt(100, 999)}-${randomInt(1, 999)}` : null,
    preferences: { theme: randomFrom(['light', 'dark', 'red-light']), notifications: randomFrom([true, false]), language: 'uk' },
  };
});

const users = [...coreUsers, ...generatedUsers];

const faqCategories = ['Реєстрація', 'Навчання', 'Менторство', 'Психологічна підтримка', 'Розклад', 'Техніка безпеки', 'Звʼязок', 'Фінанси', 'Процедури', 'FAQ'];

const faqTemplates = [
  { category: 'Реєстрація', q: 'Чи потрібно мати інвайт-код для входу у систему?', a: 'Так, інвайт-код прив’язується до вашого підрозділу. Якщо він загублений, зверніться до команди штабу.' },
  { category: 'Навчання', q: 'Як знайти рекомендовані курси за моїм профілем?', a: 'У розділі “Навчання” система підкаже курси на основі вашої спеціалізації та поточного прогресу.' },
  { category: 'Менторство', q: 'Як забронювати зустріч з ментором?', a: 'Створіть запит у розділі “Менторство” та оберіть тему. Ментор відповість протягом 24 годин.' },
  { category: 'Психологічна підтримка', q: 'Що робити, якщо я почуваюся перевантаженим?', a: 'Використайте форму “Психологічна підтримка” і опишіть, що саме вас турбує. Психолог зв’яжеться з вами анонімно.' },
  { category: 'Розклад', q: 'Де подивитися завдання на наступний тиждень?', a: 'Відкрийте “Розклад”, щоб переглянути всі призначені події, тренування і чергування для вашого підрозділу.' },
  { category: 'Техніка безпеки', q: 'Як повідомити про несправне обладнання?', a: 'Створіть запис у розділі “Оборудование” або сповістіть командира - система надішле повідомлення відповідальному техніку.' },
  { category: 'Звʼязок', q: 'Як отримати доступ до чергових каналах зв’язку?', a: 'Після входу в систему ви побачите список активних каналів у розділі “Зв’язок”. Оберіть потрібний і перевірте паролі.' },
  { category: 'Фінанси', q: 'Чи можу я переглянути звіт про витрати мого підрозділу?', a: 'Так, у розділі “Звіти” доступний щомісячний фінансовий звіт для вашого підрозділу.' },
  { category: 'Процедури', q: 'Як підтвердити участь у медичному огляді?', a: 'Після отримання запрошення натисніть “Погоджуюсь” у сповіщенні та зʼявіться у призначений час.' },
  { category: 'FAQ', q: 'Чи можу я змінити свій пароль самостійно?', a: 'Так, перейдіть у “Профіль” і скористайтеся кнопкою “Змінити пароль”.' },
  { category: 'Навчання', q: 'Які курси доступні офлайн?', a: 'Онлайн-курси та PDF-матеріали доступні у режимі офлайн, якщо курс має позначку “Offline”.' },
  { category: 'Менторство', q: 'Як побачити історію запитів до ментора?', a: 'Всі ваші запити зберігаються у розділі “Менторство”, де можна переглянути статус і відповіді.' },
  { category: 'Психологічна підтримка', q: 'Чи зберігається моя історія запитів?', a: 'Історія зберігається, але вона доступна лише вам і психологу в системі для підтримки.' },
  { category: 'Розклад', q: 'Як отримати сповіщення про зміни у завданнях?', a: 'Увімкніть повідомлення в налаштуваннях - система надсилатиме оновлення про зміни у розкладі.' },
  { category: 'Повідомлення', q: 'Де знайти минулі оголошення?', a: 'У розділі “Дошка оголошень” доступний архів останніх оголошень за останні 30 днів.' },
  { category: 'Техніка безпеки', q: 'Як вести звіт про інцидент?', a: 'Заповніть форму інциденту в розділі “Безпека”, після чого інформацію перегляне командир.' },
  { category: 'Звʼязок', q: 'Як відновити доступ до втраченої рації?', a: 'Зверніться до відповідальної служби зв’язку, щоб отримати заміну та оновити запис у системі.' },
  { category: 'Фінанси', q: 'Як зазначити витрати на спорядження?', a: 'Введіть дані у розділі “Обладнання” з інформацією про вартість та стан.' },
  { category: 'Процедури', q: 'Що робити, якщо я запізнився на навчання?', a: 'Повідомте командиру та позначте запізнення у розділі “Розклад” для підтвердження.' },
  { category: 'FAQ', q: 'Як знайти медичний пункт найближчою?', a: 'У розділі “Інформація частини” вказані адреси та графіки роботи медпунктів.' },
];

const faqs = Array.from({ length: 60 }, (_, index) => {
  const template = faqTemplates[index % faqTemplates.length];
  return {
    id: uuid(),
    category: template.category,
    q: `${template.q}`,
    a: template.a,
  };
});

const announcementTemplates = [
  { type: 'info', title: 'Оновлення графіку чергувань', text: 'Підрозділ отримав оновлені чергування на наступний тиждень. Перевірте точний розклад у розділі “Розклад”.' },
  { type: 'warning', title: 'Перевірте спорядження перед виходом', text: 'Усі бійці повинні провести інвентаризацію спорядження перед польовими навчаннями. Зверніться до технічного керівника при проблемах.' },
  { type: 'urgent', title: 'Екстрена медична евакуація', text: 'За вказівкою штабу організовано евакуацію постраждалого з тренувального полігону. Слідкуйте за подальшими вказівками.' },
  { type: 'event', title: 'Планова евакуаційна тренувальна сесія', text: 'Запрошуємо особовий склад на тренінг з евакуації та першої допомоги. Локація: польовий полігон, 10:00.' },
  { type: 'info', title: 'Нові матеріали з тактичної медицини', text: 'Додано підручники та відео з тактичної медицини у розділі “Навчання”. Рекомендуємо пройти до кінця тижня.' },
  { type: 'warning', title: 'Оновлено правила доступу до системи', text: 'Змінено політику доступу до системи, необхідно повторно підтвердити автентифікацію на наступному вході.' },
];

const announcements = Array.from({ length: 60 }, (_, index) => {
  const template = announcementTemplates[index % announcementTemplates.length];
  return {
    id: uuid(),
    title: `${template.title} ${index + 1}`,
    text: `${template.text} Деталі: ${template.title.toLowerCase()} для вашого підрозділу.`, 
    type: template.type,
    author: randomFrom(['Командування', 'Медслужба', 'Психологічна служба', 'Тренер', 'Система']),
  };
});

const moduleCategoryMap = {
  'Тактична Медицина': {
    outline: ['Першочергова допомога', 'Техніки зупинки кровотечі', 'Допомога в польових умовах'],
    summary: 'Навчальний курс із практичних дій у польових умовах для порятунку товариша.'
  },
  'Звʼязок': {
    outline: ['Управління раціями', 'Кодування повідомлень', 'Аварійна комунікація'],
    summary: 'Курс про безпечне та надійне використання тактичних каналів зв’язку.'
  },
  'Тактика': {
    outline: ['Розвідка місцевості', 'Тактичне планування', 'Контратака'],
    summary: 'Тренінг із побудови бойових маневрів та оцінки ситуації.'
  },
  'Логістика': {
    outline: ['Складські операції', 'Транспортування вантажів', 'Підтримка частини'],
    summary: 'Курс з організації постачання та управління ресурсами підрозділу.'
  },
  'Стратегія': {
    outline: ['Оцінка супротивника', 'Розробка плану', 'Командна взаємодія'],
    summary: 'Стратегічний курс для командирів старшого складу.'
  },
  'Психологічна підготовка': {
    outline: ['Стійкість під стресом', 'Командна підтримка', 'Профілактика вигорання'],
    summary: 'Матеріали для підтримки морального стану в складних умовах.'
  },
  'Маскування': {
    outline: ['Камуфляж', 'Приховані позиції', 'Захист від спостереження'],
    summary: 'Курс з технік приховування та виживання на місцевості.'
  },
  'Медіація': {
    outline: ['Управління конфліктами', 'Комунікація в стресі', 'Побудова довіри'],
    summary: 'Курс із редагування внутрішніх конфліктів та роботи в команді.'
  },
};

const trainingModules = Array.from({ length: 55 }, (_, index) => {
  const category = randomFrom(moduleCategories);
  const difficulty = randomFrom(moduleDifficulties);
  const profile = moduleCategoryMap[category];
  const tags = [category.toLowerCase().replace(/\s+/g, '_'), difficulty, 'військовий'];
  const contentSteps = profile.outline.map((item, stepIndex) => ({
    title: `${stepIndex + 1}. ${item}`,
    description: `Поглиблене заняття: ${item} у контексті ${category.toLowerCase()}.`,
  }));
  return {
    id: `module-${String(index + 1).padStart(3, '0')}-${uuid().slice(0, 8)}`,
    title: `${category}: навчальний модуль ${index + 1}`,
    description: `${profile.summary} Рівень складності: ${difficulty}.`, 
    category,
    difficulty,
    durationMinutes: randomInt(45, 150),
    tags,
    content: {
      text: `${profile.summary} Цей модуль містить теоретичні матеріали, практичні вправи та приклади з реального життя.`,
      steps: contentSteps,
      references: [`Протокол ${index + 1}`, `Командна інструкція з ${category.toLowerCase()}`, 'Список дій при екстрених ситуаціях'],
    },
    isOfflineAvailable: randomFrom([0, 1]),
    viewCount: randomInt(50, 800),
    sortOrder: index + 1,
    isActive: 1,
  };
});

const scheduleTemplates = [
  { eventType: 'training', title: 'Тактична сесія', location: 'Польовий полігон', detail: 'закріплення навичок пересування у складній місцевості' },
  { eventType: 'duty', title: 'Чергування на КПП', location: 'Контрольно-пропускний пункт', detail: 'перевірка пропускного режиму та радіозв’язку' },
  { eventType: 'meeting', title: 'Штабна нарада', location: 'Кабінет штабу', detail: 'огляд стану частини та розподіл завдань' },
  { eventType: 'medical', title: 'Медичний контроль', location: 'Медичний пункт', detail: 'огляд, вакцинація та оновлення медичної картки' },
  { eventType: 'meal', title: 'Джерело живлення', location: 'Столова', detail: 'спільний прийом їжі та інструктаж з харчування' },
  { eventType: 'rest', title: 'Час відпочинку', location: 'Спальний барак', detail: 'регламентований відпочинок та обмін досвідом' },
  { eventType: 'other', title: 'Планова перевірка зв’язку', location: 'Технічна кімната', detail: 'контроль надійності каналів і радіообладнання' },
];

const scheduleEvents = Array.from({ length: 65 }, (_, index) => {
  const template = randomFrom(scheduleTemplates);
  const unit = randomFrom(units);
  const start = new Date(now.getTime() + randomInt(1, 12) * 60 * 60 * 1000 + index * 30 * 60 * 1000);
  const end = new Date(start.getTime() + randomInt(1, 3) * 60 * 60 * 1000);
  const assigned = Array.from(new Set(Array.from({ length: randomInt(1, 4) }, () => randomFrom(users).id))).slice(0, 4);
  return {
    id: uuid(),
    unitId: unit.id,
    title: `${template.title} для ${unit.name}`,
    description: `${template.detail}. Локація: ${template.location}. Залучені особи: ${assigned.length} осіб.`,
    startTime: formatDate(start),
    endTime: formatDate(end),
    eventType: template.eventType,
    location: template.location,
    assignedUserIds: assigned.join(','),
    status: randomFrom(['scheduled', 'ongoing', 'completed', 'cancelled']),
    notifyParticipants: randomFrom([0, 1]),
    createdByUserId: randomFrom(coreUsers).id,
  };
});

const notificationTypes = ['schedule', 'mentorship', 'psychology', 'report', 'system'];
const notificationSeverities = ['info', 'warning', 'urgent'];
const notificationMessages = [
  'Ви маєте нове повідомлення від команди.',
  'Ваш запит на менторство оброблено.',
  'Заплановано нову зустріч у підрозділі.',
  'Потрібно оновити дані у профілі.',
  'Системне оновлення доступне вже сьогодні.',
];

const notifications = Array.from({ length: 110 }, (_, index) => {
  const type = randomFrom(notificationTypes);
  return {
    id: uuid(),
    userId: randomFrom(users).id,
    title: `${type === 'system' ? 'Система' : type === 'schedule' ? 'Розклад' : type === 'mentorship' ? 'Менторство' : type === 'psychology' ? 'Психологічна підтримка' : 'Звіт'}${index + 1}`,
    message: randomFrom(notificationMessages),
    type,
    severity: randomFrom(notificationSeverities),
    isRead: randomFrom([0, 1]),
    link: type === 'schedule' ? '/schedule' : type === 'mentorship' ? '/mentorship' : type === 'psychology' ? '/psychological-support' : '/notice-board',
  };
});

const mentorshipTopics = ['Тактична медицина', 'Радіозвʼязок', 'Стратегія', 'Логістика', 'Психологічна підтримка', 'Навчальні процедури'];
const mentorshipRequests = Array.from({ length: 60 }, (_, index) => {
  const recruit = randomFrom(users.filter((u) => u.role === 'recruit' || u.role === 'admin' || u.role === 'mentor'));
  const validStatus = randomFrom(['pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled']);
  return {
    id: uuid(),
    recruitId: recruit.id,
    mentorId: randomFrom(coreUsers.filter((u) => u.role === 'mentor' || u.role === 'commander' || u.role === 'admin')).id,
    topic: randomFrom(mentorshipTopics),
    description: `Запит ${index + 1}: потрібна допомога з ${randomFrom(mentorshipTopics).toLowerCase()}.`,
    status: validStatus,
    response: validStatus === 'pending' ? null : 'Ваш запит прийнято. Чекайте на відповідь ментора.',
    respondedAt: validStatus === 'pending' ? null : formatDate(new Date(now.getTime() - randomInt(1, 72) * 60 * 60 * 1000)),
  };
});

const psychologicalSupportEntries = Array.from({ length: 60 }, (_, index) => {
  const user = randomFrom(users.filter((u) => u.role !== 'superadmin'));
  const statuses = ['pending', 'responded', 'resolved'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const status = randomFrom(statuses);
  return {
    id: uuid(),
    userId: user.id,
    message: `Потребую допомоги з питанням мотивації та стресу. Запит номер ${index + 1}.`,
    contactType: randomFrom(['anonymous', 'identified']),
    psychologistId: randomFrom(coreUsers.filter((u) => u.role === 'psychologist')).id,
    response: status !== 'pending' ? 'Ми підготуємо план підтримки та звʼяжемося найближчим часом.' : null,
    respondedAt: status !== 'pending' ? formatDate(new Date(now.getTime() - randomInt(1, 48) * 60 * 60 * 1000)) : null,
    respondedByUserId: status !== 'pending' ? randomFrom(coreUsers.filter((u) => u.role === 'psychologist')).id : null,
    status,
    severity: randomFrom(severities),
    keywords: JSON.stringify(['стрес', 'мотивація', 'підтримка']),
    isEscalated: randomFrom([0, 1]),
  };
});

const equipmentCategories = ['спорядження', 'медицина', 'захист', 'звʼязок', 'техніка'];
const equipmentTypes = ['issued', 'personal', 'recommended'];
const equipmentNames = ['Тактичний рюкзак', 'Індивідуальна аптечка', 'Шолом БАРС', 'Нічні біноклі', 'Радіостанція', 'Похідний корм', 'Армійський плащ', 'Засіб для розпізнавання', 'Штурмові рукавиці', 'Спальний мішок'];

const userEquipment = Array.from({ length: 60 }, (_, index) => {
  return {
    id: uuid(),
    userId: randomFrom(users).id,
    name: randomFrom(equipmentNames),
    category: randomFrom(equipmentCategories),
    weight: +(randomInt(1, 8) + Math.random()).toFixed(1),
    type: randomFrom(equipmentTypes),
    cost: +(randomInt(500, 15000) + Math.random()).toFixed(2),
  };
});

const unitJoinRequests = Array.from({ length: 50 }, (_, index) => {
  const user = randomFrom(users.filter((u) => u.role === 'recruit'));
  return {
    id: uuid(),
    unitId: randomFrom(units).id,
    userId: user.id,
    status: randomFrom(['pending', 'approved', 'rejected']),
  };
});

const xtUserProgress = Array.from({ length: 100 }, (_, index) => {
  const user = randomFrom(users.filter((u) => u.role === 'recruit' || u.role === 'mentor' || u.role === 'psychologist'));
  const module = randomFrom(trainingModules);
  const completed = randomFrom([0, 1]);
  const progressValue = completed ? 100 : randomInt(10, 90);
  return {
    id: uuid(),
    userId: user.id,
    moduleId: module.id,
    status: completed ? 'completed' : 'in_progress',
    progress: progressValue,
  };
});

const userOnboardings = users.slice(0, 50).map((user, index) => ({
  id: uuid(),
  userId: user.id,
  profileAnswers: JSON.stringify({
    militaryExperience: randomFrom(['none', 'conscript', 'contract', 'officer']),
    education: randomFrom(['бакалавр', 'магістр', 'середня освіта', 'спеціаліст']),
    specialization: randomFrom(['звʼязок', 'тактика', 'медицина', 'логістика', 'інженерія']),
    physicalFitness: randomInt(5, 10),
    concerns: randomFrom([['стрес'], ['втома'], ['хвилювання'], ['недостача сну'], ['необхідність адаптації']]),
    skills: randomFrom([['комунікація'], ['аналіз'], ['лідерство'], ['технічні навички'], ['планування']]),
    preferredLearning: randomFrom(['visual', 'audio', 'practical', 'mixed']),
    mentorPreference: randomFrom([true, false]),
    nightShiftExperience: randomFrom([true, false]),
  }),
  generatedTrajectory: JSON.stringify({
    trajectory: ['Ознайомлення з базовими правилами', 'Тактична підготовка', 'Психологічна адаптація'],
    estimatedDuration: 6,
    difficulty: randomFrom(['легко', 'нормально', 'складно']),
    roadmap: [
      { week: 1, title: 'Вступ', modules: [trainingModules[0].id, trainingModules[1].id], goals: ['ознайомитися з частиною'], milestones: ['реєстрація'] },
      { week: 2, title: 'Практика', modules: [trainingModules[2].id], goals: ['завершити вступний блок'], milestones: ['тест з безпеки'] },
    ],
    personalRecommendations: ['переглянути відео', 'записатися на тренінг'],
  }),
  progress: JSON.stringify({ week: 1, completedModules: randomInt(0, 3), totalModules: 5, score: randomInt(50, 95) }),
  isCompleted: randomFrom([0, 1]),
  createdAt: timestamp,
  updatedAt: timestamp,
}));

const userProgressRecords = Array.from({ length: 60 }, (_, index) => {
  const user = randomFrom(users);
  const module = randomFrom(trainingModules);
  const finished = randomFrom([0, 1]);
  return {
    id: uuid(),
    userId: user.id,
    moduleId: module.id,
    completionPercentage: finished ? 100 : randomInt(20, 90),
    score: finished ? randomInt(70, 100) : randomInt(30, 80),
    isCompleted: finished ? 1 : 0,
    completedAt: finished ? timestamp : null,
    attemptCount: randomInt(1, 3),
    answers: JSON.stringify({ correct: randomInt(5, 20), wrong: randomInt(0, 5) }),
  };
});

const insert = {
  unit: db.prepare('INSERT OR REPLACE INTO "military_units" ("id", "name", "commanderId", "inviteCode", "createdAt") VALUES (?, ?, ?, ?, ?)'),
  user: db.prepare('INSERT OR REPLACE INTO "users" ("id", "email", "passwordHash", "firstName", "lastName", "rank", "position", "civilProfession", "role", "unitId", "isActive", "lastLoginAt", "profilePictureUrl", "preferences", "offlineSyncData", "encryptedLocalKey", "createdAt", "updatedAt", "middleName", "currentStatus", "callsign", "weaponName", "weaponNumber", "commanderNotes") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  faq: db.prepare('INSERT OR REPLACE INTO "faq" ("id", "category", "q", "a", "createdAt") VALUES (?, ?, ?, ?, ?)'),
  announcement: db.prepare('INSERT OR REPLACE INTO "announcements" ("id", "title", "text", "type", "author", "createdAt") VALUES (?, ?, ?, ?, ?, ?)'),
  notification: db.prepare('INSERT OR REPLACE INTO "notifications" ("id", "userId", "title", "message", "isRead", "link", "type", "severity", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  equipment: db.prepare('INSERT OR REPLACE INTO "user_equipment" ("id", "userId", "name", "category", "weight", "type", "cost", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  psychological: db.prepare('INSERT OR REPLACE INTO "psychological_support" ("id", "userId", "message", "contactType", "psychologistId", "response", "respondedAt", "respondedByUserId", "status", "severity", "keywords", "isEscalated", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  mentorship: db.prepare('INSERT OR REPLACE INTO "mentorship_requests" ("id", "recruitId", "mentorId", "topic", "description", "response", "status", "createdAt", "respondedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  unitJoin: db.prepare('INSERT OR REPLACE INTO "unit_join_requests" ("id", "unitId", "userId", "status", "createdAt") VALUES (?, ?, ?, ?, ?)'),
  trainingModule: db.prepare('INSERT OR REPLACE INTO "training_modules" ("id", "title", "description", "category", "difficulty", "durationMinutes", "tags", "content", "isOfflineAvailable", "viewCount", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  scheduleEvent: db.prepare('INSERT OR REPLACE INTO "schedule_events" ("id", "unitId", "title", "description", "startTime", "endTime", "eventType", "location", "assignedUserIds", "status", "notifyParticipants", "createdByUserId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  xtProgress: db.prepare('INSERT OR REPLACE INTO "xt_user_progress" ("id", "userId", "moduleId", "status", "progress", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)'),
  onboarding: db.prepare('INSERT OR REPLACE INTO "user_onboarding" ("id", "user_id", "profileAnswers", "generatedTrajectory", "progress", "isCompleted", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  userProgress: db.prepare('INSERT OR REPLACE INTO "user_progress" ("id", "userId", "moduleId", "completionPercentage", "score", "isCompleted", "completedAt", "attemptCount", "answers", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
};

const runTransaction = (stmt, rows, runRow) => {
  const tx = db.transaction((items) => items.forEach(runRow));
  tx(rows);
};

runTransaction(insert.unit, units, (item) => insert.unit.run(item.id, item.name, null, item.inviteCode, timestamp));

runTransaction(insert.user, users, (item) => insert.user.run(
  item.id,
  item.email,
  hashPassword(item.password),
  item.firstName,
  item.lastName,
  item.rank || null,
  item.position || null,
  item.civilProfession || null,
  item.role,
  item.unitId || null,
  1,
  null,
  null,
  JSON.stringify(item.preferences || {}),
  null,
  null,
  timestamp,
  timestamp,
  item.middleName || null,
  item.currentStatus || 'active',
  item.callsign || null,
  item.weaponName || null,
  item.weaponNumber || null,
  null
));

runTransaction(insert.faq, faqs, (item) => insert.faq.run(item.id, item.category, item.q, item.a, timestamp));
runTransaction(insert.announcement, announcements, (item) => insert.announcement.run(item.id, item.title, item.text, item.type, item.author, timestamp));
runTransaction(insert.trainingModule, trainingModules, (item) => insert.trainingModule.run(item.id, item.title, item.description, item.category, item.difficulty, item.durationMinutes, item.tags.join(','), JSON.stringify(item.content), item.isOfflineAvailable ? 1 : 0, item.viewCount, item.sortOrder, item.isActive ? 1 : 0, timestamp, timestamp));
runTransaction(insert.scheduleEvent, scheduleEvents, (item) => insert.scheduleEvent.run(item.id, item.unitId, item.title, item.description, item.startTime, item.endTime, item.eventType, item.location, item.assignedUserIds, item.status, item.notifyParticipants ? 1 : 0, item.createdByUserId, timestamp, timestamp));
runTransaction(insert.notification, notifications, (item) => insert.notification.run(item.id, item.userId, item.title, item.message, item.isRead, item.link, item.type, item.severity, timestamp));
runTransaction(insert.equipment, userEquipment, (item) => insert.equipment.run(item.id, item.userId, item.name, item.category, item.weight, item.type, item.cost, timestamp));
runTransaction(insert.mentorship, mentorshipRequests, (item) => insert.mentorship.run(item.id, item.recruitId, item.mentorId, item.topic, item.description, item.response, item.status, timestamp, item.respondedAt));
runTransaction(insert.psychological, psychologicalSupportEntries, (item) => insert.psychological.run(item.id, item.userId, item.message, item.contactType, item.psychologistId, item.response, item.respondedAt, item.respondedByUserId, item.status, item.severity, item.keywords, item.isEscalated ? 1 : 0, timestamp, timestamp));
runTransaction(insert.unitJoin, unitJoinRequests, (item) => insert.unitJoin.run(item.id, item.unitId, item.userId, item.status, timestamp));
runTransaction(insert.xtProgress, xtUserProgress, (item) => insert.xtProgress.run(item.id, item.userId, item.moduleId, item.status, item.progress, timestamp, timestamp));
runTransaction(insert.onboarding, userOnboardings, (item) => insert.onboarding.run(item.id, item.userId, item.profileAnswers, item.generatedTrajectory, item.progress, item.isCompleted ? 1 : 0, item.createdAt, item.updatedAt));
runTransaction(insert.userProgress, userProgressRecords, (item) => insert.userProgress.run(item.id, item.userId, item.moduleId, item.completionPercentage, item.score, item.isCompleted ? 1 : 0, item.completedAt, item.attemptCount, item.answers, timestamp, timestamp));

console.log('✅ Згенеровано великий набір тестових даних:');
console.log(`  units: ${units.length}`);
console.log(`  users: ${users.length}`);
console.log(`  faqs: ${faqs.length}`);
console.log(`  announcements: ${announcements.length}`);
console.log(`  training modules: ${trainingModules.length}`);
console.log(`  schedule events: ${scheduleEvents.length}`);
console.log(`  notifications: ${notifications.length}`);
console.log(`  mentorship requests: ${mentorshipRequests.length}`);
console.log(`  psychological support entries: ${psychologicalSupportEntries.length}`);
console.log(`  equipment items: ${userEquipment.length}`);
console.log(`  join requests: ${unitJoinRequests.length}`);
console.log(`  xt user progress records: ${xtUserProgress.length}`);
console.log(`  user onboarding records: ${userOnboardings.length}`);
console.log(`  user progress records: ${userProgressRecords.length}`);

try {
  db.close();
  console.log('📦 Дані додано до military_system.db');
} catch (err) {
  console.error('❌ Помилка при закритті бази:', err.message || err);
}
