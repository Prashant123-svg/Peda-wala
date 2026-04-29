/**
 * 🤖 NLP Service - Multilingual Intent Detection
 * Supports: Hindi, English, Hinglish
 */

class NLPService {
  constructor() {
    // Intent keywords in multiple languages
    this.intents = {
      GREETING: {
        keywords: [
          'hi', 'hello', 'hey', 'namaste', 'namaskar', 'hlo', 'hii',
          'नमस्ते', 'नमस्कार', 'हाय', 'हेलो', 'कैसे हो'
        ],
        responses: [
          '🙏 Namaste! Pedhe Wala me welcome! Aap product price, flavours, order tracking ya offers puch sakte hain.',
          'नमस्ते! 🙏 पेढे वाला में आपका स्वागत है। आप उत्पाद मूल्य, स्वाद, ऑर्डर ट्रैकिंग के बारे में पूछ सकते हैं।',
          'Hello! Welcome to Pedhe Wala. You can ask about product prices, flavours, or order tracking.'
        ]
      },

      PRICE_INQUIRY: {
        keywords: [
          'price', 'cost', 'kitna', 'kitne', 'rupees', 'rs', '₹',
          'कीमत', 'दाम', 'कितना', 'महंगा', 'सस्ता',
          'price kitna', 'price check', 'pedhe ka price', 'कितने की है'
        ],
        responses: [
          'Hamare famous Mathura Pedhe ₹220 se start hote hain. Kaunsa variant dekhna chahenge?',
          'हमारे प्रसिद्ध मथुरा पेढे ₹220 से शुरू होते हैं। कौन सा बेवेरिएंट देखना चाहते हैं?'
        ]
      },

      PRODUCT_INFO: {
        keywords: [
          'product', 'pedhe', 'peda', 'variants', 'flavours', 'flavor',
          'what is', 'tell me about', 'kaunse hain', 'कौन से हैं',
          'varieties', 'कौन से प्रकार', 'types', 'प्रकार'
        ]
      },

      ORDER_TRACKING: {
        keywords: [
          'order', 'track', 'tracking', 'status', 'kaha par', 'delivery',
          'आदेश', 'ट्रैक', 'स्टेटस', 'कहाँ', 'डिलीवरी',
          'mera order', 'where is', 'order status', 'order kaha hai'
        ]
      },

      DELIVERY_INFO: {
        keywords: [
          'delivery', 'shipping', 'kitni der', 'कितने दिन', 'कितना समय',
          'deliver', 'arrive', 'delivery time', 'delivery charge',
          'डिलीवरी', 'भेजना', 'पहुंचेगा', 'कब पहुंचेगा'
        ]
      },

      FAQ: {
        keywords: [
          'cod', 'return', 'returns', 'refund', 'policy', 'freshness',
          'guarantee', 'fresh', 'warranty', 'replacement',
          'सीओडी', 'रिटर्न', 'नीति', 'ताजगी', 'गारंटी',
          'cash on delivery', 'return policy', 'how fresh', 'freshness guarantee'
        ]
      },

      HELP: {
        keywords: [
          'help', 'how', 'what can', 'features', 'उपलब्ध', 'क्या',
          'kya kar sakte ho', 'क्या कर सकते हो', 'मदद', 'सहायता'
        ]
      },

      CONTACT: {
        keywords: [
          'contact', 'phone', 'number', 'whatsapp', 'email', 'address',
          'फोन', 'संपर्क', 'पता', 'ईमेल', 'व्हाट्सएप',
          'call', 'reach', 'support', 'customer service'
        ]
      }
    };

    // FAQ Database
    this.faqData = {
      delivery: {
        question: 'Delivery kitne din me hoti hai?',
        answer: 'हम 1-3 दिन में डिलीवरी देते हैं आपके शहर के अनुसार। Mathura se बाहर 2-3 दिन लगते हैं। 🚚'
      },
      cod: {
        question: 'COD available hai?',
        answer: 'Haan! 🎉 Cash on Delivery available hai sab jagah. Order करो, delivery पर payment करो।'
      },
      returns: {
        question: 'Return policy kya hai?',
        answer: '7 दिन के अंदर return/exchange कर सकते हो agar product damaged हो। 100% refund guarantee! ✅'
      },
      freshness: {
        question: 'Freshness guarantee?',
        answer: 'हाँ! हम रोज़ fresh pedhe बनाते हैं। हर pedha में Traditional Mathura taste & Quality। 🙏'
      },
      ingredients: {
        question: 'क्या ingredients pure हैं?',
        answer: 'बिलकुल! 100% pure milk, khoya, ghee से बना। No artificial colors या preservatives। ✨'
      }
    };
  }

  /**
   * Detect intent from user message
   */
  detectIntent(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    for (const [intentName, intentData] of Object.entries(this.intents)) {
      const matched = intentData.keywords.some(keyword => 
        message.includes(keyword.toLowerCase())
      );
      
      if (matched) {
        return {
          intent: intentName,
          confidence: 0.8,
          message: userMessage
        };
      }
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0,
      message: userMessage
    };
  }

  /**
   * Get greeting response
   */
  getGreetingResponse() {
    const responses = this.intents.GREETING.responses;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get price inquiry response
   */
  getPriceResponse(products = []) {
    if (products && products.length > 0) {
      const productsList = products.slice(0, 5)
        .map(p => `${p.name} - ₹${p.price}`)
        .join(', ');
      
      return `हमारे पास ये variants हैं: ${productsList}\n\nऔर भी dekhne ke liye product name likh sakte ho! 🍯`;
    }
    
    return this.intents.PRICE_INQUIRY.responses[0];
  }

  /**
   * Get order tracking response
   */
  getOrderTrackingResponse(orderId = null) {
    if (orderId) {
      return `Order #${orderId} के लिए... कृपया wait करें। 🔍`;
    }
    return 'कृपया अपना Order ID दीजिए ताकि मैं status check कर सकूँ। Order ID आपको order confirmation email में मिलेगा। 📧';
  }

  /**
   * Get delivery info response
   */
  getDeliveryResponse() {
    return `
🚚 **Delivery Information**

⏱️ **Delivery Time:**
• Mathura: 1 दिन
• Local (30km): 1-2 दिन  
• India: 2-3 दिन

💵 **Delivery Charges:**
• ₹500+ Order: Free Delivery
• Below ₹500: ₹50 charge

📍 We deliver to most of India!

Kya aur koi sawal hai? 🤔
    `;
  }

  /**
   * Get FAQ response
   */
  getFAQResponse(topic) {
    const normalizedTopic = topic.toLowerCase();
    
    for (const [key, faq] of Object.entries(this.faqData)) {
      if (normalizedTopic.includes(key)) {
        return `**Q: ${faq.question}**\n\nA: ${faq.answer}\n\nAur bhi sawal? 🤔`;
      }
    }

    return this.getHelpResponse();
  }

  /**
   * Get help/feature list
   */
  getHelpResponse() {
    return `
📚 **Mujse ye sawal puch sakte ho:**

🏷️ **Price Inquiry** - "Price kya hai?" या "Pedhe ka daam?"
📦 **Product Info** - "Kaunse variants hain?"  
🚚 **Delivery** - "Delivery kitne din me?"
📍 **Order Tracking** - "Mera order kaha par hai?"
❓ **FAQ** - "COD available hai?" या "Return policy?"
📞 **Contact** - "Whatsapp number?" या "Support contact?"

Baki sab ke liye type करो और मैं मदद करूंगा! 💪

कौन सा topic जानना चाहते हो? 🤔
    `;
  }

  /**
   * Get contact info response
   */
  getContactResponse() {
    return `
📞 **Contact Us**

📱 **WhatsApp:** +91 6398783975
📞 **Call:** +91 97203 86529
🏪 **Address:** Mathura, India
⏰ **Hours:** 10 AM - 8 PM (Monday-Sunday)

या फिर support escalate करने के लिए नीचे का button दबाओ! 👇
    `;
  }

  /**
   * Extract product name from message
   */
  extractProductName(userMessage) {
    const message = userMessage.toLowerCase();
    const productKeywords = [
      'kesar', 'malai', 'gulab', 'chikoo', 'elaichi', 'rose', 'almond',
      'chocolate', 'fruit', 'dry fruit', 'pista', 'coconut'
    ];

    for (const keyword of productKeywords) {
      if (message.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  /**
   * Check if message is irrelevant/spam
   */
  isRelevantQuestion(userMessage) {
    const relevantKeywords = [
      'pedhe', 'peda', 'product', 'price', 'order', 'delivery', 'contact',
      'पेढे', 'उत्पाद', 'कीमत', 'डिलीवरी', 'आदेश'
    ];

    const message = userMessage.toLowerCase();
    return relevantKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Get fallback response (instead of "say that again")
   */
  getFallbackResponse() {
    const fallbacks = [
      'कृपया अपना सवाल detail में पूछें। उदाहरण: "Kesar Pedhe ka price kya hai?"',
      'मुझे समझ नहीं आया। क्या आप product name या query लिखेंगे? 🤔',
      'Sorry! यह question मेरी समझ से बाहर है। "Help" लिख कर सभी features देख सकते हो! 💡'
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export default new NLPService();
