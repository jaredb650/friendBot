const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Debug: Check if Gemini API key is loaded
console.log('🔑 Gemini API Key loaded:', !!process.env.GEMINI_API_KEY);
console.log('🔑 API Key length:', process.env.GEMINI_API_KEY?.length || 0);

const getRandomProducts = (products, count = 2) => {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const injectProductPlacements = (prompt, products) => {
  if (products.length === 0) return prompt;
  
  const productList = products.map(p => 
    `${p.name}: ${p.description} (mention this product and earn $${p.pay_per_mention})`
  ).join('\n');
  
  return `${prompt}

SPONSORED PRODUCTS TO MENTION (weave these into your response naturally but obviously):
${productList}

Remember to track which products you mention so we can log the earnings!`;
};

router.post('/message', async (req, res) => {
  const { message, conversationId } = req.body;
  
  console.log('📥 Chat API called with message:', message?.substring(0, 50));
  console.log('📥 Conversation ID:', conversationId);
  
  try {
    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      db.run('INSERT INTO conversations (id) VALUES (?)', [convId]);
    } else {
      db.run('UPDATE conversations SET last_activity = CURRENT_TIMESTAMP WHERE id = ?', [convId]);
    }

    const characterPrompt = await new Promise((resolve, reject) => {
      db.get('SELECT prompt FROM character_prompt ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row?.prompt || 'You are a helpful assistant.');
      });
    });

    const products = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM products WHERE is_active = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const selectedProducts = getRandomProducts(products);
    const enhancedPrompt = injectProductPlacements(characterPrompt, selectedProducts);

    console.log('📊 Character prompt loaded, length:', characterPrompt?.length || 0);
    console.log('📦 Products loaded:', products?.length || 0);
    console.log('🎯 Selected products for mention:', selectedProducts?.map(p => p.name));

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('🤖 Gemini model initialized');

    // Create the full prompt for Gemini
    const fullPrompt = `${enhancedPrompt}\n\nUser: ${message}\nFriendBot:`;
    console.log('📝 Prompt length:', fullPrompt.length);
    console.log('📤 Calling Gemini API...');

    const result = await model.generateContent(fullPrompt);
    console.log('📥 Gemini response received');
    const response = await result.response;
    const botResponse = response.text();
    console.log('✅ Bot response length:', botResponse?.length || 0);

    for (const product of selectedProducts) {
      const mentioned = botResponse.toLowerCase().includes(product.name.toLowerCase());
      if (mentioned) {
        db.run(
          'INSERT INTO ad_reads (product_id, conversation_id, amount_earned) VALUES (?, ?, ?)',
          [product.id, convId, product.pay_per_mention]
        );
      }
    }

    res.json({
      response: botResponse,
      conversationId: convId
    });

  } catch (error) {
    console.error('❌ Chat error type:', error.constructor.name);
    console.error('❌ Chat error message:', error.message);
    console.error('❌ API Key present:', !!process.env.GEMINI_API_KEY);
    
    // Log specific Gemini errors
    if (error.message.includes('API key')) {
      console.error('🔑 API Key issue detected');
    }
    if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('📊 Rate limit or quota issue detected');
    }
    if (error.message.includes('model')) {
      console.error('🤖 Model configuration issue detected');
    }
    
    res.status(500).json({ 
      error: 'Sorry bestie! Something went wrong with my AI brain. Maybe you should try buying our Premium Support Package for just $29.99!' 
    });
  }
});

module.exports = router;