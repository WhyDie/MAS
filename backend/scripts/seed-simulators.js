/**
 * Seed simulators
 * Run: cd backend && node scripts/seed-simulators.js
 */
const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../military_system.db');
const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

function uuid() { return crypto.randomUUID(); }
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const simulators = [
  {
    title: 'Тактичний медичний сценарій',
    description: 'Симулюйте надання першої допомоги пораненому побратиму в бойових умовах. Використовуйте протокол MARCH.',
    type: 'scenario',
    difficulty: 'normal',
    category: 'Тактична медицина',
    estimatedMinutes: 15,
    tags: ['медицина', 'перша допомога', 'MARCH'],
    isActive: true,
    requiresCompletion: true,
  },
  {
    title: 'Вікторина: Озброєння ЗСУ',
    description: 'Тест на знання особистого складу озброєння та техніки Збройних Сил України.',
    type: 'quiz',
    difficulty: 'easy',
    category: 'Озброєння',
    estimatedMinutes: 10,
    tags: ['зброя', 'вікторина', 'тест'],
    isActive: true,
    requiresCompletion: false,
  },
  {
    title: 'Бойова підготовка: Вогневий контакт',
    description: 'Сценарій вогневого контакту з противником. Приймайте рішення щодо тактики дій.',
    type: 'combat_drill',
    difficulty: 'hard',
    category: 'Тактика',
    estimatedMinutes: 20,
    tags: ['бойова підготовка', 'тактика', 'вогневий контакт'],
    isActive: true,
    requiresCompletion: true,
  },
  {
    title: 'Виживання в польових умовах',
    description: 'Симулятор виживання: знайдіть воду, розведіть вогонь, побудуйте укриття.',
    type: 'survival',
    difficulty: 'normal',
    category: 'Виживання',
    estimatedMinutes: 25,
    tags: ['виживання', 'польові умови', 'навички'],
    isActive: true,
    requiresCompletion: true,
  },
  {
    title: 'Радіозвʼязок: Протокол переговорів',
    description: 'Відпрацюйте правильний протокол радіопереговорів в умовах бойових дій.',
    type: 'communication',
    difficulty: 'easy',
    category: 'Звʼязок',
    estimatedMinutes: 12,
    tags: ['радіозвʼязок', 'протокол', 'комунікація'],
    isActive: true,
    requiresCompletion: false,
  },
  {
    title: 'Топографія: Орієнтування на місцевості',
    description: 'Визначте координати, розберіть карту місцевості та прокладіть маршрут.',
    type: 'quiz',
    difficulty: 'normal',
    category: 'Топографія',
    estimatedMinutes: 18,
    tags: ['топографія', 'карта', 'навігація'],
    isActive: true,
    requiresCompletion: true,
  },
];

console.log('🎮 Seeding training simulators...');

const stmt = db.prepare(`
  INSERT OR REPLACE INTO training_simulators
  (id, title, description, type, difficulty, category, estimatedMinutes, tags, isActive, requiresCompletion, completionCount, averageScore, averageTimeMinutes, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 0, 0, ?, ?)
`);

const insertMany = db.transaction((simulators) => {
  let count = 0;
  for (const s of simulators) {
    stmt.run(uuid(), s.title, s.description, s.type, s.difficulty, s.category, s.estimatedMinutes, JSON.stringify(s.tags), s.requiresCompletion ? 1 : 0, now, now);
    count++;
    console.log(`  ✅ ${s.title}`);
  }
  return count;
});

try {
  const inserted = insertMany(simulators);
  console.log(`\n✅ Successfully seeded ${inserted} simulators!`);
} catch (err) {
  console.error('❌ Error:', err.message);
}

db.close();
