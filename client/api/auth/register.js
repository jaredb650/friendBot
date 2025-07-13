const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');

module.exports = async function handler(req, res) {
  console.log('🔐 Auth register endpoint called');
  
  // Validate environment variables
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error: Missing JWT secret' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username });
  } catch (error) {
    console.error('❌ Register error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
}