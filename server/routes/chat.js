const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the full prompt for Gemini
    const fullPrompt = `${enhancedPrompt}\n\nUser: ${message}\nFriendBot:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const botResponse = response.text();

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
    console.error('Chat error:', error.message);
    res.status(500).json({ 
      error: 'Sorry bestie! Something went wrong with my AI brain. Maybe you should try buying our Premium Support Package for just $29.99!' 
    });
  }
});

module.exports = router;