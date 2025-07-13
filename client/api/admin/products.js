const jwt = require('jsonwebtoken');
const { parse } = require('url');
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
  console.log('🛍️ Products API called with method:', req.method);
  
  try {
    // Authenticate user
    authenticateToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const { pathname } = parse(req.url, true);
  const pathParts = pathname.split('/').filter(part => part);
  const productId = pathParts[pathParts.length - 1];

  if (req.method === 'GET') {
    // Get all products
    try {
      const db = getDatabase();
      const products = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      res.json(products);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'POST') {
    // Create new product
    const { name, description, payPerMention } = req.body;
    
    try {
      const db = getDatabase();
      const result = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO products (name, description, pay_per_mention) VALUES (?, ?, ?)',
          [name, description, payPerMention],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });
      
      res.json({ id: result.id, success: true });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'PUT') {
    // Update product
    const { name, description, payPerMention, isActive } = req.body;
    
    try {
      const db = getDatabase();
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET name = ?, description = ?, pay_per_mention = ?, is_active = ? WHERE id = ?',
          [name, description, payPerMention, isActive, productId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'DELETE') {
    // Delete product
    try {
      const db = getDatabase();
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};