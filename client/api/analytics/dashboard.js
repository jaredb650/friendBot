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
    console.log('📊 Starting analytics data retrieval...');

    // Execute analytics queries with detailed logging
    console.log('📊 Fetching total earnings...');
    const totalEarningsResult = await query('SELECT SUM(amount_earned) as total FROM ad_reads');
    const totalEarnings = parseFloat(totalEarningsResult.rows[0]?.total || 0);
    console.log('📊 Total earnings:', totalEarnings, 'Type:', typeof totalEarnings);

    console.log('📊 Fetching total ad reads...');
    const totalAdReadsResult = await query('SELECT COUNT(*) as count FROM ad_reads');
    const totalAdReads = parseInt(totalAdReadsResult.rows[0]?.count || 0);
    console.log('📊 Total ad reads:', totalAdReads, 'Type:', typeof totalAdReads);

    console.log('📊 Fetching total conversations...');
    const totalConversationsResult = await query('SELECT COUNT(*) as count FROM conversations');
    const totalConversations = parseInt(totalConversationsResult.rows[0]?.count || 0);
    console.log('📊 Total conversations:', totalConversations, 'Type:', typeof totalConversations);

    console.log('📊 Fetching product stats...');
    const productStatsResult = await query(`
      SELECT 
        p.name,
        p.pay_per_mention,
        COUNT(ar.id) as mentions,
        COALESCE(SUM(ar.amount_earned), 0) as earnings
      FROM products p
      LEFT JOIN ad_reads ar ON p.id = ar.product_id
      GROUP BY p.id, p.name, p.pay_per_mention
      ORDER BY earnings DESC
    `);
    
    // Sanitize product stats data
    const productStats = productStatsResult.rows?.map(row => ({
      name: row.name || 'Unknown Product',
      pay_per_mention: parseFloat(row.pay_per_mention || 0),
      mentions: parseInt(row.mentions || 0),
      earnings: parseFloat(row.earnings || 0)
    })) || [];
    
    console.log('📊 Product stats:', productStats.length, 'products');
    console.log('📊 Product stats data:', JSON.stringify(productStats, null, 2));

    console.log('📊 Fetching daily earnings...');
    const dailyEarningsResult = await query(`
      SELECT 
        DATE(timestamp) as date,
        COALESCE(SUM(amount_earned), 0) as earnings,
        COUNT(*) as ad_reads
      FROM ad_reads
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
    
    // Sanitize daily earnings data
    const dailyEarnings = dailyEarningsResult.rows?.map(row => ({
      date: row.date,
      earnings: parseFloat(row.earnings || 0),
      ad_reads: parseInt(row.ad_reads || 0)
    })) || [];
    
    console.log('📊 Daily earnings:', dailyEarnings.length, 'entries');
    console.log('📊 Daily earnings sample:', JSON.stringify(dailyEarnings.slice(0, 3), null, 2));

    const results = {
      totalEarnings: totalEarnings,
      totalAdReads: totalAdReads,
      totalConversations: totalConversations,
      productStats: productStats,
      dailyEarnings: dailyEarnings
    };

    console.log('📊 Final analytics result structure:', {
      totalEarnings: typeof results.totalEarnings,
      totalAdReads: typeof results.totalAdReads,
      totalConversations: typeof results.totalConversations,
      productStatsCount: results.productStats.length,
      dailyEarningsCount: results.dailyEarnings.length
    });

    console.log('📊 Analytics data retrieved successfully');
    res.json(results);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    console.error('❌ Analytics error stack:', error.stack);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};