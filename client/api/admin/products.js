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
      console.log('🛍️ Creating new product:', {
        name,
        description: description?.substring(0, 50) + '...',
        payPerMention,
        payPerMentionType: typeof payPerMention
      });
      
      // Validate and sanitize input
      const sanitizedPayPerMention = parseFloat(payPerMention) || 0;
      
      const result = await query(
        'INSERT INTO products (name, description, pay_per_mention) VALUES ($1, $2, $3) RETURNING id, name, pay_per_mention',
        [name, description, sanitizedPayPerMention]
      );
      
      const createdProduct = result.rows[0];
      console.log('🛍️ Product created successfully:', {
        id: createdProduct.id,
        name: createdProduct.name,
        payPerMention: createdProduct.pay_per_mention,
        payPerMentionType: typeof createdProduct.pay_per_mention
      });
      
      res.json({ id: createdProduct.id, success: true });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Product creation data:', { name, description, payPerMention });
      res.status(500).json({ error: 'Database error', details: error.message });
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
    // Delete product and ALL associated analytics data
    try {
      console.log('🗑️ Starting complete product deletion for ID:', productId);
      
      // First delete all ad_reads (analytics) associated with this product
      const adReadsResult = await query('DELETE FROM ad_reads WHERE product_id = $1', [productId]);
      console.log('🗑️ Deleted ad_reads:', adReadsResult.rowCount || 0);
      
      // Then delete the product itself
      const productResult = await query('DELETE FROM products WHERE id = $1', [productId]);
      console.log('🗑️ Deleted product:', productResult.rowCount || 0);
      
      if (productResult.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      console.log('✅ Complete product deletion successful for ID:', productId);
      res.json({ 
        success: true, 
        message: 'Product and all analytics data deleted successfully',
        deletedAdReads: adReadsResult.rowCount || 0
      });
    } catch (error) {
      console.error('❌ Error during complete product deletion:', error);
      console.error('❌ Product ID:', productId);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};