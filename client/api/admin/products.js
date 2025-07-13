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
  console.log('🛍️ Full URL:', req.url);
  
  try {
    // Authenticate user
    authenticateToken(req);
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return res.status(401).json({ error: error.message });
  }

  const { pathname } = parse(req.url, true);
  console.log('🛍️ Parsed pathname:', pathname);
  
  const pathParts = pathname.split('/').filter(part => part);
  console.log('🛍️ Path parts:', pathParts);
  
  const productId = pathParts[pathParts.length - 1];
  console.log('🛍️ Extracted productId:', productId, 'Type:', typeof productId);

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
    console.log('📝 PUT request received for product update');
    console.log('📝 Extracted productId from URL:', productId);
    console.log('📝 ProductId type:', typeof productId);
    
    const { name, description, payPerMention, isActive } = req.body;
    console.log('📝 Update payload:', { name, description, payPerMention, isActive });
    
    // Validate productId
    if (!productId || isNaN(productId)) {
      console.error('❌ Invalid product ID for update:', productId);
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const numericProductId = parseInt(productId);
    console.log('📝 Converted to numeric ID:', numericProductId);
    
    try {
      // Check if product exists first
      const existsResult = await query('SELECT id FROM products WHERE id = $1', [numericProductId]);
      if (!existsResult.rows || existsResult.rows.length === 0) {
        console.error('❌ Product not found for update with ID:', numericProductId);
        return res.status(404).json({ error: 'Product not found' });
      }
      
      console.log('📝 Product exists, proceeding with update...');
      
      const updateResult = await query(
        'UPDATE products SET name = $1, description = $2, pay_per_mention = $3, is_active = $4 WHERE id = $5',
        [name, description, payPerMention, isActive, numericProductId]
      );
      
      console.log('📝 Update result rowCount:', updateResult.rowCount);
      
      if (updateResult.rowCount === 0) {
        console.error('❌ Product update failed - no rows affected');
        return res.status(500).json({ error: 'Failed to update product - database error' });
      }
      
      console.log('✅ Product updated successfully:', numericProductId);
      res.json({ success: true, productId: numericProductId });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Product ID:', productId);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    // Delete product and ALL associated analytics data
    try {
      console.log('🗑️ Starting complete product deletion for ID:', productId);
      console.log('🗑️ ProductId type:', typeof productId);
      console.log('🗑️ ProductId isNaN:', isNaN(productId));
      
      // Validate productId
      if (!productId || isNaN(productId)) {
        console.error('❌ Invalid product ID provided:', productId);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
      
      const numericProductId = parseInt(productId);
      console.log('🗑️ Converted to numeric ID:', numericProductId);
      
      // Check if product exists first
      console.log('🗑️ Checking if product exists...');
      const existsResult = await query('SELECT id, name FROM products WHERE id = $1', [numericProductId]);
      console.log('🗑️ Product exists query result:', existsResult.rows);
      
      if (!existsResult.rows || existsResult.rows.length === 0) {
        console.error('❌ Product not found with ID:', numericProductId);
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const productName = existsResult.rows[0].name;
      console.log('🗑️ Found product:', productName);
      
      // First delete all ad_reads (analytics) associated with this product
      console.log('🗑️ Deleting associated ad_reads...');
      const adReadsResult = await query('DELETE FROM ad_reads WHERE product_id = $1', [numericProductId]);
      console.log('🗑️ Deleted ad_reads:', adReadsResult.rowCount || 0);
      
      // Then delete the product itself
      console.log('🗑️ Deleting product...');
      const productResult = await query('DELETE FROM products WHERE id = $1', [numericProductId]);
      console.log('🗑️ Deleted product rows:', productResult.rowCount || 0);
      
      if (productResult.rowCount === 0) {
        console.error('❌ Product deletion failed - no rows affected');
        return res.status(500).json({ error: 'Failed to delete product - database error' });
      }
      
      console.log('✅ Complete product deletion successful for ID:', numericProductId);
      res.json({ 
        success: true, 
        message: `Product "${productName}" and all analytics data deleted successfully`,
        deletedAdReads: adReadsResult.rowCount || 0,
        productId: numericProductId,
        productName: productName
      });
    } catch (error) {
      console.error('❌ Error during complete product deletion:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Product ID:', productId);
      console.error('❌ Error type:', error.constructor.name);
      res.status(500).json({ error: 'Database error', details: error.message, stack: error.stack });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};