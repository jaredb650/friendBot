const jwt = require('jsonwebtoken');
const { parse } = require('url');
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
      const result = await query('SELECT * FROM products ORDER BY created_at DESC');
      const products = result.rows || [];
      
      console.log('🛍️ Products retrieved:', products.length);
      res.json(products);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'POST') {
    // Create new product
    const { name, description, payPerMention } = req.body;
    
    try {
      const result = await query(
        'INSERT INTO products (name, description, pay_per_mention) VALUES ($1, $2, $3) RETURNING id',
        [name, description, payPerMention]
      );
      
      console.log('🛍️ Product created:', name);
      res.json({ id: result.rows[0].id, success: true });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'PUT') {
    // Update product
    const { name, description, payPerMention, isActive } = req.body;
    
    try {
      await query(
        'UPDATE products SET name = $1, description = $2, pay_per_mention = $3, is_active = $4 WHERE id = $5',
        [name, description, payPerMention, isActive, productId]
      );
      
      console.log('🛍️ Product updated:', productId);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'DELETE') {
    // Delete product
    try {
      await query('DELETE FROM products WHERE id = $1', [productId]);
      
      console.log('🛍️ Product deleted:', productId);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};