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
  console.log('📊 Analytics dashboard API called');
  
  try {
    // Authenticate user
    authenticateToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDatabase();
    const queries = {
      totalEarnings: `SELECT SUM(amount_earned) as total FROM ad_reads`,
      totalAdReads: `SELECT COUNT(*) as count FROM ad_reads`,
      totalConversations: `SELECT COUNT(*) as count FROM conversations`,
      productStats: `
        SELECT 
          p.name,
          p.pay_per_mention,
          COUNT(ar.id) as mentions,
          SUM(ar.amount_earned) as earnings
        FROM products p
        LEFT JOIN ad_reads ar ON p.id = ar.product_id
        GROUP BY p.id, p.name, p.pay_per_mention
        ORDER BY earnings DESC
      `,
      dailyEarnings: `
        SELECT 
          DATE(timestamp) as date,
          SUM(amount_earned) as earnings,
          COUNT(*) as ad_reads
        FROM ad_reads
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `
    };

    const results = {};
    
    // Execute single value queries
    for (const [key, query] of Object.entries(queries)) {
      if (key === 'productStats' || key === 'dailyEarnings') {
        results[key] = await new Promise((resolve, reject) => {
          db.all(query, (err, rows) => {
            if (err) {
              console.error(`Error in ${key}:`, err);
              resolve([]);
            } else {
              resolve(rows || []);
            }
          });
        });
      } else {
        results[key] = await new Promise((resolve, reject) => {
          db.get(query, (err, row) => {
            if (err) {
              console.error(`Error in ${key}:`, err);
              resolve(0);
            } else {
              resolve(row ? row[Object.keys(row)[0]] || 0 : 0);
            }
          });
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};