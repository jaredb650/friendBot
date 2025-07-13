const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');

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
    // Execute analytics queries
    const totalEarningsResult = await query('SELECT SUM(amount_earned) as total FROM ad_reads');
    const totalEarnings = totalEarningsResult.rows[0]?.total || 0;

    const totalAdReadsResult = await query('SELECT COUNT(*) as count FROM ad_reads');
    const totalAdReads = totalAdReadsResult.rows[0]?.count || 0;

    const totalConversationsResult = await query('SELECT COUNT(*) as count FROM conversations');
    const totalConversations = totalConversationsResult.rows[0]?.count || 0;

    const productStatsResult = await query(`
      SELECT 
        p.name,
        p.pay_per_mention,
        COUNT(ar.id) as mentions,
        SUM(ar.amount_earned) as earnings
      FROM products p
      LEFT JOIN ad_reads ar ON p.id = ar.product_id
      GROUP BY p.id, p.name, p.pay_per_mention
      ORDER BY earnings DESC
    `);
    const productStats = productStatsResult.rows || [];

    const dailyEarningsResult = await query(`
      SELECT 
        DATE(timestamp) as date,
        SUM(amount_earned) as earnings,
        COUNT(*) as ad_reads
      FROM ad_reads
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
    const dailyEarnings = dailyEarningsResult.rows || [];

    const results = {
      totalEarnings,
      totalAdReads,
      totalConversations,
      productStats,
      dailyEarnings
    };

    console.log('📊 Analytics data retrieved successfully');
    res.json(results);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};