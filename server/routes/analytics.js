const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, (req, res) => {
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
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    if (key === 'productStats' || key === 'dailyEarnings') {
      db.all(query, (err, rows) => {
        if (err) {
          console.error(`Error in ${key}:`, err);
          results[key] = [];
        } else {
          results[key] = rows;
        }
        completed++;
        if (completed === total) {
          res.json(results);
        }
      });
    } else {
      db.get(query, (err, row) => {
        if (err) {
          console.error(`Error in ${key}:`, err);
          results[key] = 0;
        } else {
          results[key] = row[Object.keys(row)[0]] || 0;
        }
        completed++;
        if (completed === total) {
          res.json(results);
        }
      });
    }
  });
});

router.get('/product/:id/performance', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.all(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as mentions,
      SUM(amount_earned) as earnings
    FROM ad_reads 
    WHERE product_id = ? AND timestamp >= datetime('now', '-30 days')
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;