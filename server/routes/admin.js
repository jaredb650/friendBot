const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/character-prompt', authenticateToken, (req, res) => {
  db.get('SELECT prompt FROM character_prompt ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ prompt: row?.prompt || '' });
  });
});

router.post('/character-prompt', authenticateToken, (req, res) => {
  const { prompt } = req.body;
  
  db.run('INSERT INTO character_prompt (prompt) VALUES (?)', [prompt], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

router.get('/products', authenticateToken, (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

router.post('/products', authenticateToken, (req, res) => {
  const { name, description, payPerMention } = req.body;
  
  db.run(
    'INSERT INTO products (name, description, pay_per_mention) VALUES (?, ?, ?)',
    [name, description, payPerMention],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

router.put('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, payPerMention, isActive } = req.body;
  
  db.run(
    'UPDATE products SET name = ?, description = ?, pay_per_mention = ?, is_active = ? WHERE id = ?',
    [name, description, payPerMention, isActive, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

router.delete('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

module.exports = router;