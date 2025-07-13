const jwt = require('jsonwebtoken');
const { getDatabase } = require('../utils/database');

// Authentication middleware
const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

module.exports = async function handler(req, res) {
  console.log('📝 Character prompt API called with method:', req.method);
  
  try {
    // Authenticate user
    authenticateToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  if (req.method === 'GET') {
    // Get current character prompt
    try {
      const db = getDatabase();
      const prompt = await new Promise((resolve, reject) => {
        db.get('SELECT prompt FROM character_prompt ORDER BY id DESC LIMIT 1', (err, row) => {
          if (err) reject(err);
          else resolve(row?.prompt || '');
        });
      });
      
      res.json({ prompt });
    } catch (error) {
      console.error('❌ Error fetching prompt:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'POST') {
    // Create/update character prompt
    const { prompt } = req.body;
    
    try {
      const db = getDatabase();
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO character_prompt (prompt) VALUES (?)', [prompt], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error saving prompt:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};