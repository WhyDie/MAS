/**
 * Seed military resources
 * Run: cd backend && node scripts/seed-resources.js
 */
const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../military_system.db');
const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

function uuid() { return crypto.randomUUID(); }
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const resources = [
  { name: 'Міністерство оборони України', url: 'https://www.mil.gov.ua', description: 'Офіційний сайт Міноборони. Новини, накази, нормативні документи, інформація про службу.', icon: '🏛️', category: 'official', sortOrder: 0 },
  { name: 'Генеральний штаб ЗСУ', url: 'https://www.gs.mil.gov.ua', description: 'Операційна інформація, карти, офіційні повідомлення про хід бойових дій.', icon: '🗺️', category: 'official', sortOrder: 1 },
  { name: 'Є-Військо (портал)', url: 'https://e-viysko.gov.ua', description: 'Єдиний державний портал для військовослужбовців. Рапорти, довідки, особистий кабінет.', icon: '📱', category: 'official', sortOrder: 2 },
  { name: 'Повернись живим', url: 'https://savelife.in.ua', description: 'Благодійний фонд допомоги армії. Закупівля обладнання, навчання, реабілітація.', icon: '🛡️', category: 'support', sortOrder: 3 },
  { name: 'Український ветеранський фонд', url: 'https://uvf.in.ua', description: 'Фінансова допомога ветеранам, гранти на лікування, навчання, бізнес.', icon: '💚', category: 'support', sortOrder: 4 },
  { name: 'Гаряча лінія ветеранів', url: 'tel:0800506570', description: 'Безкоштовна гаряча лінія: 0 800 506 570. Консультації з усіх питань.', icon: '📞', category: 'support', sortOrder: 5 },
  { name: 'Дія (портал послуг)', url: 'https://diia.gov.ua', description: 'Державні послуги онлайн. Посвідчення ветерана, довідки, виплати.', icon: '📲', category: 'benefits', sortOrder: 6 },
  { name: 'Пенсійний фонд України', url: 'https://www.pfu.gov.ua', description: 'Військова пенсія, інвалідність, пільговий стаж. Оформлення документів.', icon: '💰', category: 'benefits', sortOrder: 7 },
  { name: 'Безоплатна правнича допомога', url: 'https://www.legalaid.gov.ua', description: 'Безкоштовна юридична допомога військовослужбовцям та ветеранам.', icon: '⚖️', category: 'benefits', sortOrder: 8 },
  { name: 'Prometheus — курси', url: 'https://prometheus.org.ua', description: 'Безкоштовні онлайн-курси: IT, медицина, менеджмент, кібербезпека.', icon: '💻', category: 'training', sortOrder: 9 },
  { name: 'Diia Digital Education', url: 'https://osvita.diia.gov.ua', description: 'Безкоштовні цифрові курси: компʼютерна грамотність, кібербезпека.', icon: '🖥️', category: 'training', sortOrder: 10 },
  { name: 'Ветеранський простір', url: 'https://veteranspace.in.ua', description: 'Спільнота ветеранів, події, зустрічі, можливості для спілкування.', icon: '👥', category: 'community', sortOrder: 11 },
  { name: 'АрміяInform', url: 'https://armyinform.com.ua', description: 'Інформаційне видання про ЗСУ. Новини, аналітика, інтервʼю.', icon: '📰', category: 'community', sortOrder: 12 },
  { name: 'MilitaryLand', url: 'https://militaryland.net', description: 'Довідник військових підрозділів, символи, історія ЗСУ.', icon: '🗂️', category: 'community', sortOrder: 13 },
];

console.log('🌐 Seeding military resources...');

const stmt = db.prepare(`
  INSERT OR REPLACE INTO military_resources
  (id, name, url, description, icon, category, sortOrder, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`);

const insertMany = db.transaction((resources) => {
  let count = 0;
  for (const r of resources) {
    stmt.run(uuid(), r.name, r.url, r.description, r.icon, r.category, r.sortOrder, now, now);
    count++;
    console.log(`  ✅ ${r.name}`);
  }
  return count;
});

try {
  const inserted = insertMany(resources);
  console.log(`\n✅ Successfully seeded ${inserted} military resources!`);
} catch (err) {
  console.error('❌ Error:', err.message);
}

db.close();
