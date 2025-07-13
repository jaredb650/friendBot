const jwt = require('jsonwebtoken');
const { query } = require('../../utils/database');

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
  try {
    console.log('🛍️ Dynamic Products API called with method:', req.method);
    console.log('🛍️ Full URL:', req.url);
    console.log('🛍️ Query params:', req.query);
    console.log('🛍️ Headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Test database connection first
    console.log('🔗 Testing database connection...');
    await query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Authenticate user
    console.log('🔐 Authenticating user...');
    authenticateToken(req);
    console.log('✅ Authentication successful');

    const productId = req.query.id;
    console.log('🛍️ Product ID from query:', productId, 'Type:', typeof productId);

    if (req.method === 'PUT') {
      // Update product
      console.log('📝 PUT request received for product update');
      console.log('📝 Product ID:', productId);
      
      const { name, description, payPerMention, isActive } = req.body;
      console.log('📝 Update payload:', { name, description, payPerMention, isActive });
      
      // Validate productId
      if (!productId || isNaN(productId)) {
        console.error('❌ Invalid product ID for update:', productId);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
      
      const numericProductId = parseInt(productId);
      console.log('📝 Converted to numeric ID:', numericProductId);
      
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
      
    } else if (req.method === 'DELETE') {
      // Delete product and ALL associated analytics data
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
      
    } else {
      console.log('❌ Method not allowed:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (globalError) {
    console.error('❌ Global error handler:', globalError);
    console.error('❌ Global error stack:', globalError.stack);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: globalError.message,
      stack: globalError.stack 
    });
  }
};