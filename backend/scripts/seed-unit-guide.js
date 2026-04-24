/**
 * Seed script to populate unit rooms and staff
 * Run with: cd backend && node scripts/seed-unit-guide.js
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../military_system.db');
const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

function uuid() {
  return crypto.randomUUID();
}

const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

// ===== ROOMS =====
const rooms = [
  // Command
  { name: 'Кабінет командира частини', floor: 2, roomNumber: '201', description: 'Командир частини. Прийом: вівторок, четвер 14:00-16:00', icon: '⭐', category: 'command' },
  { name: 'Кабінет начальника штабу', floor: 2, roomNumber: '203', description: 'Начальник штабу. Щоденні наради 08:00', icon: '📋', category: 'command' },
  { name: 'Кабінет заступника командира', floor: 2, roomNumber: '205', description: 'Заступник командира з бойової підготовки', icon: '🎖️', category: 'command' },
  { name: 'Кабінет заступника з тилу', floor: 1, roomNumber: '108', description: 'Заступник командира з тилового забезпечення', icon: '📦', category: 'command' },

  // Support
  { name: 'Відділ кадрів (стройова частина)', floor: 1, roomNumber: '105', description: 'Рапорти, відпустки, відрядження, особові справи', icon: '📄', category: 'support' },
  { name: 'Фінансова служба', floor: 1, roomNumber: '107', description: 'Грошове забезпечення, виплати, пільги', icon: '💰', category: 'support' },
  { name: 'Медична служба (медпункт)', floor: 1, roomNumber: '102', description: 'Медичний огляд, довідки, лікування. Лікар: 08:00-17:00', icon: '⚕️', category: 'support' },
  { name: 'Служба захисту персоналу', floor: 2, roomNumber: '210', description: 'Соціальний та правовий захист військовослужбовців', icon: '🛡️', category: 'support' },

  // Living
  { name: 'Гуртожиток (казарма) №1', floor: 0, roomNumber: '—', description: 'Проживання особового складу. Поверхи 1-3', icon: '🏠', category: 'living' },
  { name: 'Гуртожиток (казарма) №2', floor: 0, roomNumber: '—', description: 'Проживання особового складу. Поверхи 1-3', icon: '🏠', category: 'living' },
  { name: 'Кімната відпочинку', floor: 1, roomNumber: '115', description: 'Телевізор, настільні ігри, книги. Доступ 18:00-22:00', icon: '🎮', category: 'living' },
  { name: 'Лазня/пральня', floor: 0, roomNumber: '—', description: 'Лазня: понеділок, середа, пʼятниця 18:00-21:00. Пральня: цілодобово', icon: '🚿', category: 'living' },
  { name: 'Поштова служба', floor: 1, roomNumber: '112', description: 'Отримання листів, посилок, бандеролей', icon: '📬', category: 'living' },

  // Food
  { name: 'Столова (їдальня)', floor: 0, roomNumber: '—', description: 'Сніданок: 07:00-08:00 | Обід: 13:00-14:00 | Вечеря: 19:00-20:00', icon: '🍽️', category: 'food' },
  { name: 'Чайова кухня', floor: 0, roomNumber: '—', description: 'Гаряча вода, чай, кава. Доступ цілодобово', icon: '☕', category: 'food' },

  // Training
  { name: 'Навчальний клас (теорія)', floor: 2, roomNumber: '215', description: 'Теоретичні заняття, семінари. Розклад на дошці оголошень', icon: '📚', category: 'training' },
  { name: 'Тир (стрілецька галерея)', floor: 0, roomNumber: '—', description: 'Стрілецька підготовка. Графік: вівторок, четвер 10:00-12:00', icon: '🎯', category: 'training' },
  { name: 'Спортивний зал', floor: 0, roomNumber: '—', description: 'Фізична підготовка. Графік: щодня 06:00-07:00, 17:00-19:00', icon: '💪', category: 'training' },
  { name: 'Тактичне поле', floor: 0, roomNumber: '—', description: 'Тактичні навчання, польові виходи. За розкладом', icon: '🏕️', category: 'training' },

  // Storage
  { name: 'Склад зброї (КДП)', floor: 0, roomNumber: '—', description: 'Отримання/здача зброї. Черговий по КДП цілодобово', icon: '🔫', category: 'storage' },
  { name: 'Склад майна (речовий)', floor: 0, roomNumber: '—', description: 'Видача форми, взуття, постільної білизни. Пн-Пт 09:00-16:00', icon: '🎒', category: 'storage' },
  { name: 'Склад ПЗМ (продовольчий)', floor: 0, roomNumber: '—', description: 'Видача продуктів, ІРП, води. За розпорядженням начальника тилу', icon: '📦', category: 'storage' },
];

// ===== STAFF =====
const staff = [
  { rank: 'Полковник', fullName: 'Коваленко О.В.', position: 'Командир частини', room: '201', floor: 2, phone: 'вн. 101', icon: '⭐' },
  { rank: 'Підполковник', fullName: 'Бондаренко І.П.', position: 'Начальник штабу', room: '203', floor: 2, phone: 'вн. 102', icon: '📋' },
  { rank: 'Майор', fullName: 'Ткаченко М.С.', position: 'Заступник командира з БП', room: '205', floor: 2, phone: 'вн. 103', icon: '🎖️' },
  { rank: 'Капітан', fullName: 'Шевченко А.О.', position: 'Заступник командира з тилу', room: '108', floor: 1, phone: 'вн. 104', icon: '📦' },
  { rank: 'Старший лейтенант', fullName: 'Мельник В.М.', position: 'Начальник стройової частини', room: '105', floor: 1, phone: 'вн. 201', icon: '📄' },
  { rank: 'Лейтенант', fullName: 'Кравченко Д.І.', position: 'Фінансова служба', room: '107', floor: 1, phone: 'вн. 202', icon: '💰' },
  { rank: 'Капітан мед. служби', fullName: 'Лисенко О.Р.', position: 'Начальник медпункту', room: '102', floor: 1, phone: 'вн. 301', icon: '⚕️' },
  { rank: 'Старший сержант', fullName: 'Савченко П.В.', position: 'Старшина роти', room: '—', floor: 0, phone: '—', icon: '🎖️' },
];

console.log('🏢 Seeding Unit Guide data...');

// Seed rooms
const roomStmt = db.prepare(`
  INSERT OR REPLACE INTO unit_rooms
  (id, name, description, icon, category, floor, roomNumber, phone, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`);

const seedRooms = db.transaction((rooms) => {
  let count = 0;
  for (const r of rooms) {
    roomStmt.run(uuid(), r.name, r.description, r.icon, r.category, r.floor, r.roomNumber, null, now, now);
    count++;
    console.log(`  ✅ ${r.name}`);
  }
  return count;
});

// Seed staff
const staffStmt = db.prepare(`
  INSERT OR REPLACE INTO unit_staff
  (id, rank, fullName, position, icon, room, floor, phone, description, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)
`);

const seedStaff = db.transaction((staff) => {
  let count = 0;
  for (const s of staff) {
    staffStmt.run(uuid(), s.rank, s.fullName, s.position, s.icon, s.room, s.floor, s.phone, now, now);
    count++;
    console.log(`  ✅ ${s.rank} ${s.fullName}`);
  }
  return count;
});

try {
  const roomsCount = seedRooms(rooms);
  const staffCount = seedStaff(staff);
  console.log(`\n✅ Successfully seeded ${roomsCount} rooms and ${staffCount} staff members!`);
} catch (err) {
  console.error('❌ Error seeding:', err.message);
}

db.close();
