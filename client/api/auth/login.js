const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../utils/database');

module.exports = async function handler(req, res) {
  console.log('🔐 Auth login endpoint called');
  
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
    const db = getDatabase();
    const admin = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM admins WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}