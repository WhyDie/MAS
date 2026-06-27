const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

// Підключаємось до вашої бази даних
const dbPath = path.resolve(__dirname, '../military_system.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const id = crypto.randomUUID();
const code = 'GODMODE';
const role = 'superadmin';
const expiresAt = new Date();
expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Дійсний 10 років

try {
  // Переконуємось, що таблиця існує
  db.prepare(`
    CREATE TABLE IF NOT EXISTS "invite_codes" (
      "id" varchar PRIMARY KEY,
      "code" varchar UNIQUE NOT NULL,
      "defaultRole" varchar NOT NULL,
      "createdByUserId" varchar,
      "usedByUserId" varchar,
      "usedAt" datetime,
      "expiresAt" datetime,
      "isUsed" boolean DEFAULT 0,
      "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Вставляємо інвайт-код (додано createdByUserId: 'SYSTEM')
  db.prepare('INSERT INTO "invite_codes" ("id", "code", "defaultRole", "createdByUserId", "isUsed", "expiresAt") VALUES (?, ?, ?, ?, 0, ?)').run(id, code, role, 'SYSTEM', expiresAt.toISOString());

  console.log(`✅ СУПЕР-ІНВАЙТ СТВОРЕНО!`);
  console.log(`🔑 Код доступу: ${code}`);
  console.log(`Тепер перейдіть на http://localhost:5173/register та використайте цей код.`);
} catch (error) {
  if (error.message.includes('UNIQUE constraint failed')) {
    console.log(`⚠️ Код ${code} вже існує! Можете реєструватися.`);
  } else {
    console.error('❌ Помилка:', error.message);
  }
} finally {
  db.close();
}