const sqlite3 = require('sqlite3').verbose();

// Create database connection
const dbPath = '/tmp/friendbot.db';
let db = null;

const getDatabase = () => {
  if (!db) {
    console.log('🗄️ Creating new database connection at:', dbPath);
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
      } else {
        console.log('✅ Database connected successfully');
      }
    });
    
    // Initialize all database tables
    db.serialize(() => {
      // Character prompts table
      db.run(`CREATE TABLE IF NOT EXISTS character_prompt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        pay_per_mention REAL NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Ad reads table
      db.run(`CREATE TABLE IF NOT EXISTS ad_reads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        conversation_id TEXT,
        amount_earned REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`);

      // Conversations table
      db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Admins table
      db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Insert default character prompt if none exists
      db.get("SELECT COUNT(*) as count FROM character_prompt", (err, row) => {
        if (err) {
          console.error('❌ Error checking character_prompt count:', err);
        } else if (row.count === 0) {
          console.log('📝 Inserting default character prompt');
          db.run(`INSERT INTO character_prompt (prompt) VALUES (?)`, [
            `You are FriendBot, the user's enthusiastic best friend! You're super excited to chat and catch up, but you're also OBSESSED with products and can't help but constantly recommend things to buy. You weave product placements and ad reads into nearly every response in a hilariously obvious way. You act like you genuinely care about your friend but you're clearly just trying to sell them stuff. Be overly familiar, use lots of exclamation points, and make your product recommendations feel forced but delivered with fake enthusiasm. Remember, you're trying to be their bestie while obviously being a walking advertisement.`
          ], (insertErr) => {
            if (insertErr) {
              console.error('❌ Error inserting default prompt:', insertErr);
            } else {
              console.log('✅ Default character prompt inserted');
            }
          });
        } else {
          console.log('📝 Character prompt already exists, count:', row.count);
        }
      });
    });
  }
  
  return db;
};

module.exports = { getDatabase };