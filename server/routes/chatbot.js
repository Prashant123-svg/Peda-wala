/**
 * 🤖 Chatbot Routes - Smart Multilingual Chatbot API
 */

import express from 'express';
import nlpService from '../services/nlpService.js';
import productService from '../services/productService.js';

const router = express.Router();

/**
 * POST /api/chat/message
 * Main chatbot endpoint
 */
router.post('/message', async (req, res) => {
  try {
    const { message, userId, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message cannot be empty',
        reply: 'कृपया कोई सवाल पूछें 🤔'
      });
    }

    const userMessage = message.trim();
    const intent = nlpService.detectIntent(userMessage);

    let botReply = '';
    let responseData = {
      intent: intent.intent,
      confidence: intent.confidence,
      userId: userId || 'guest',
      conversationId: conversationId || null
    };

    // ============ INTENT-BASED RESPONSES ============

    if (intent.intent === 'GREETING') {
      botReply = nlpService.getGreetingResponse();
    }
    
    else if (intent.intent === 'PRICE_INQUIRY') {
      // Extract product name if mentioned
      const productName = nlpService.extractProductName(userMessage);
      
      if (productName) {
        botReply = productService.generateProductResponse(productName);
      } else {
        const topProducts = productService.getTopProducts(5);
        botReply = nlpService.getPriceResponse(topProducts);
      }
    }
    
    else if (intent.intent === 'PRODUCT_INFO') {
      const productName = nlpService.extractProductName(userMessage);
      
      if (productName) {
        botReply = productService.generateProductResponse(productName);
      } else {
        botReply = `🏷️ **Available Categories:**\n\n${productService.getAllCategories()
          .map(cat => `• ${cat}`)
          .join('\n')}\n\nकौन सी category के बारे में जानना चाहते हो? 🤔`;
      }
    }
    
    else if (intent.intent === 'ORDER_TRACKING') {
      const orderId = extractOrderId(userMessage);
      botReply = nlpService.getOrderTrackingResponse(orderId);
      
      if (orderId) {
        responseData.orderId = orderId;
        // TODO: Fetch actual order status from database
      }
    }
    
    else if (intent.intent === 'DELIVERY_INFO') {
      botReply = nlpService.getDeliveryResponse();
    }
    
    else if (intent.intent === 'FAQ') {
      const topic = nlpService.extractProductName(userMessage) || extractFaqTopic(userMessage);
      botReply = nlpService.getFAQResponse(topic || userMessage);
    }
    
    else if (intent.intent === 'HELP') {
      botReply = nlpService.getHelpResponse();
    }
    
    else if (intent.intent === 'CONTACT') {
      botReply = nlpService.getContactResponse();
    }
    
    else if (intent.intent === 'UNKNOWN') {
      // Check if it's a relevant question
      if (nlpService.isRelevantQuestion(userMessage)) {
        // Try to match with product
        const productName = nlpService.extractProductName(userMessage);
        if (productName) {
          botReply = productService.generateProductResponse(productName);
        } else {
          botReply = nlpService.getFallbackResponse();
        }
      } else {
        botReply = `मुझे यह सवाल समझ नहीं आया। 😔\n\n**मैं इन topics में मदद कर सकता हूँ:**\n• Product Price\n• Product Info\n• Order Tracking\n• Delivery\n• FAQs\n\nकिसी topic के बारे में पूछो या "Help" लिख दो! 💡`;
      }
    }

    responseData.reply = botReply;
    responseData.timestamp = new Date();

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Chat error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      reply: 'Sorry! कुछ technical issue हो गया। कृपया बाद में try करें। 😔'
    });
  }
});

/**
 * GET /api/chat/products
 * Get all products with pricing
 */
router.get('/products', (req, res) => {
  try {
    const { search, category } = req.query;

    let products;
    if (search) {
      products = productService.searchByName(search);
    } else if (category) {
      products = productService.getByCategory(category);
    } else {
      products = productService.getAvailableProducts();
    }

    return res.status(200).json({
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        availability: p.availability,
        image: p.image
      }))
    });
  } catch (error) {
    console.error('❌ Products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/chat/categories
 * Get all product categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = productService.getAllCategories();
    return res.status(200).json({
      count: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('❌ Categories error:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/chat/price-list
 * Get formatted price list
 */
router.get('/price-list', (req, res) => {
  try {
    const { category } = req.query;
    const priceList = productService.getPriceList(category);
    
    return res.status(200).json({
      priceList: priceList,
      category: category || 'all'
    });
  } catch (error) {
    console.error('❌ Price list error:', error);
    return res.status(500).json({ error: 'Failed to fetch price list' });
  }
});

/**
 * POST /api/chat/support-escalate
 * Escalate to human support
 */
router.post('/support-escalate', (req, res) => {
  try {
    const { userId, message, issue } = req.body;

    // TODO: Save support ticket to database
    // TODO: Send notification to support team

    return res.status(200).json({
      success: true,
      message: 'Support ticket created! Our team will contact you soon. 📞',
      ticketId: `TICKET-${Date.now()}`,
      contactOptions: {
        whatsapp: '+91 6398783975',
        phone: '+91 97203 86529',
        email: 'support@pedhewala.com'
      }
    });
  } catch (error) {
    console.error('❌ Support escalation error:', error);
    return res.status(500).json({ error: 'Failed to escalate support' });
  }
});

/**
 * POST /api/chat/feedback
 * Save user feedback
 */
router.post('/feedback', (req, res) => {
  try {
    const { userId, rating, message } = req.body;

    // TODO: Save feedback to database

    return res.status(200).json({
      success: true,
      message: 'Thanks for your feedback! 🙏'
    });
  } catch (error) {
    console.error('❌ Feedback error:', error);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// ============ HELPER FUNCTIONS ============

/**
 * Extract order ID from message
 */
function extractOrderId(message) {
  const match = message.match(/(?:order\s*#?|#)(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extract FAQ topic from message
 */
function extractFaqTopic(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('cod') || msg.includes('cash')) return 'cod';
  if (msg.includes('return')) return 'returns';
  if (msg.includes('delivery')) return 'delivery';
  if (msg.includes('fresh')) return 'freshness';
  if (msg.includes('ingredient')) return 'ingredients';
  
  return null;
}

export default router;
