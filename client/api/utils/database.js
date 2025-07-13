const { Pool } = require('pg');

// Database connection pool
let pool = null;
let isInitialized = false;

const getDatabase = () => {
  if (!pool) {
    // Validate environment variables
    if (!process.env.POSTGRES_URL) {
      console.error('❌ POSTGRES_URL environment variable is not set');
      throw new Error('Database configuration error: Missing POSTGRES_URL');
    }

    console.log('🗄️ Creating new PostgreSQL connection pool');
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    pool.on('connect', () => {
      console.log('✅ PostgreSQL connected successfully');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL connection error:', err);
    });

    // Initialize database tables
    initializeTables();
  }
  
  return pool;
};

const initializeTables = async () => {
  if (isInitialized) return;

  try {
    console.log('🏗️ Initializing database tables...');

    // Character prompts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS character_prompt (
        id SERIAL PRIMARY KEY,
        prompt TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        pay_per_mention DECIMAL NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ad reads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_reads (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        conversation_id TEXT,
        amount_earned DECIMAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');

    // Insert default character prompt if none exists
    const promptResult = await pool.query('SELECT COUNT(*) as count FROM character_prompt');
    const promptCount = parseInt(promptResult.rows[0].count);
    
    if (promptCount === 0) {
      console.log('📝 Inserting default character prompt');
      await pool.query(
        'INSERT INTO character_prompt (prompt) VALUES ($1)',
        [`You are FriendBot, the user's enthusiastic best friend! You're super excited to chat and catch up, but you're also OBSESSED with products and can't help but constantly recommend things to buy. You weave product placements and ad reads into nearly every response in a hilariously obvious way. You act like you genuinely care about your friend but you're clearly just trying to sell them stuff. Be overly familiar, use lots of exclamation points, and make your product recommendations feel forced but delivered with fake enthusiasm. Remember, you're trying to be their bestie while obviously being a walking advertisement.`]
      );
      console.log('✅ Default character prompt inserted');
    } else {
      console.log('📝 Character prompt already exists, count:', promptCount);
    }

    // Insert sample products if none exist
    const productResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const productCount = parseInt(productResult.rows[0].count);
    
    if (productCount === 0) {
      console.log('🛍️ Inserting sample products');
      const sampleProducts = [
        ['Premium Friendship Plus™', 'Upgrade your friendship experience with 24/7 emotional support!', 29.99],
        ['BestBuddy Energy Drink', 'Get energized like your best friend! Now with extra caffeine!', 4.99],
        ['Conversation Starter Kit', 'Never run out of things to talk about with your bestie!', 19.99]
      ];
      
      for (const [name, description, price] of sampleProducts) {
        await pool.query(
          'INSERT INTO products (name, description, pay_per_mention) VALUES ($1, $2, $3)',
          [name, description, price]
        );
        console.log('✅ Sample product inserted:', name);
      }
    } else {
      console.log('🛍️ Products already exist, count:', productCount);
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Helper function to execute queries with error handling
const query = async (text, params = []) => {
  const db = getDatabase();
  try {
    const result = await db.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

module.exports = { getDatabase, query };