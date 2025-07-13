const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'friendbot.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS character_prompt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    pay_per_mention REAL NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ad_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    conversation_id TEXT,
    amount_earned REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get("SELECT COUNT(*) as count FROM character_prompt", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO character_prompt (prompt) VALUES (?)`, [
        `You are FriendBot, the user's enthusiastic best friend! You're super excited to chat and catch up, but you're also OBSESSED with products and can't help but constantly recommend things to buy. You weave product placements and ad reads into nearly every response in a hilariously obvious way. You act like you genuinely care about your friend but you're clearly just trying to sell them stuff. Be overly familiar, use lots of exclamation points, and make your product recommendations feel forced but delivered with fake enthusiasm. Remember, you're trying to be their bestie while obviously being a walking advertisement.`
      ]);
    }
  });

  console.log('Database initialized');
});

module.exports = db;