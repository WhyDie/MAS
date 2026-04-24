/**
 * Seed arrival steps
 * Run: cd backend && node scripts/seed-arrival-steps.js
 */
const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../military_system.db');
const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

function uuid() { return crypto.randomUUID(); }
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const steps = [
  { title: 'Прибуття до частини', description: 'Зверніться до вартового на КПП. Предʼявіть посвідчення/направлення. Вас проводять до чергового по частині.', icon: '🚪' },
  { title: 'Реєстрація в стройовій частині', description: 'Каб. 105, 1 поверх. Оформлення особової справи, видача посвідчення військовослужбовця.', icon: '📋' },
  { title: 'Медичний огляд', description: 'Каб. 102 (медпункт). Первинний огляд, аналізи, щеплення. Отримання медичної картки.', icon: '⚕️' },
  { title: 'Отримання майна', description: 'Речовий склад. Отримання форми, взуття, постільної білизни, особистого майна.', icon: '🎒' },
  { title: 'Отримання зброї', description: 'КДП (кімната зберігання зброї). Отримання зброї під розписку з подальшим закріпленням.', icon: '🔫' },
  { title: 'Призначення до підрозділу', description: 'Наказом командира частини вас призначають до конкретного підрозділу (роти, взводу).', icon: '🎖️' },
  { title: 'Знайомство з командуванням', description: 'Представлення командиру взводу, роти. Отримання розпорядку дня та обовʼязків.', icon: '👥' },
  { title: 'Поселення', description: 'Отримання місця в казармі/гуртожитку. Знайомство з побратимами.', icon: '🏠' },
];

console.log('📝 Seeding arrival steps...');

const stmt = db.prepare(`
  INSERT OR REPLACE INTO unit_arrival_steps
  (id, title, description, icon, sortOrder, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, 1, ?, ?)
`);

const insertMany = db.transaction((steps) => {
  let count = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    stmt.run(uuid(), s.title, s.description, s.icon, i, now, now);
    count++;
    console.log(`  ✅ ${i + 1}. ${s.title}`);
  }
  return count;
});

try {
  const inserted = insertMany(steps);
  console.log(`\n✅ Successfully seeded ${inserted} arrival steps!`);
} catch (err) {
  console.error('❌ Error:', err.message);
}

db.close();
