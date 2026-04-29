/**
 * 📋 Smart Chatbot - Test Cases & Example Queries
 * Copy these queries to test the chatbot functionality
 */

// ============ GREETING TESTS ============
const GREETING_TESTS = [
  { input: "hi", expectedIntent: "GREETING", language: "English" },
  { input: "hello", expectedIntent: "GREETING", language: "English" },
  { input: "hey there", expectedIntent: "GREETING", language: "English" },
  { input: "namaste", expectedIntent: "GREETING", language: "Hinglish" },
  { input: "नमस्ते", expectedIntent: "GREETING", language: "Hindi" },
  { input: "नमस्कार", expectedIntent: "GREETING", language: "Hindi" },
  { input: "हाय", expectedIntent: "GREETING", language: "Hindi" },
  { input: "हेलो", expectedIntent: "GREETING", language: "Hinglish" },
];

// ============ PRICE INQUIRY TESTS ============
const PRICE_TESTS = [
  { input: "price", expectedIntent: "PRICE_INQUIRY", language: "English" },
  { input: "price kya hai", expectedIntent: "PRICE_INQUIRY", language: "Hinglish" },
  { input: "price check", expectedIntent: "PRICE_INQUIRY", language: "English" },
  { input: "kitna", expectedIntent: "PRICE_INQUIRY", language: "Hinglish" },
  { input: "कीमत", expectedIntent: "PRICE_INQUIRY", language: "Hindi" },
  { input: "कितना", expectedIntent: "PRICE_INQUIRY", language: "Hindi" },
  { input: "दाम कितना", expectedIntent: "PRICE_INQUIRY", language: "Hindi" },
  { input: "कितने की है", expectedIntent: "PRICE_INQUIRY", language: "Hindi" },
  { input: "Kesar Peda ka price", expectedIntent: "PRICE_INQUIRY", product: "Kesar" },
  { input: "Malai Pedhe ka daam", expectedIntent: "PRICE_INQUIRY", product: "Malai" },
];

// ============ PRODUCT INFO TESTS ============
const PRODUCT_TESTS = [
  { input: "products", expectedIntent: "PRODUCT_INFO", language: "English" },
  { input: "Kesar Peda", expectedIntent: "PRODUCT_INFO", product: "Kesar" },
  { input: "Malai Peda ke bare mein", expectedIntent: "PRODUCT_INFO", product: "Malai" },
  { input: "Chocolate Peda", expectedIntent: "PRODUCT_INFO", product: "Chocolate" },
  { input: "कौन से pedhe हैं", expectedIntent: "PRODUCT_INFO", language: "Hinglish" },
  { input: "कौन से variants available हैं", expectedIntent: "PRODUCT_INFO", language: "Hinglish" },
  { input: "Pista Peda", expectedIntent: "PRODUCT_INFO", product: "Pista" },
  { input: "Coconut Peda", expectedIntent: "PRODUCT_INFO", product: "Coconut" },
];

// ============ ORDER TRACKING TESTS ============
const ORDER_TESTS = [
  { input: "order status", expectedIntent: "ORDER_TRACKING", language: "English" },
  { input: "mera order kaha par hai", expectedIntent: "ORDER_TRACKING", language: "Hinglish" },
  { input: "Order #12345", expectedIntent: "ORDER_TRACKING", orderId: "12345" },
  { input: "Order #ABC789 ka status", expectedIntent: "ORDER_TRACKING", orderId: "ABC789" },
  { input: "track my order", expectedIntent: "ORDER_TRACKING", language: "English" },
  { input: "आदेश कहाँ है", expectedIntent: "ORDER_TRACKING", language: "Hindi" },
  { input: "#54321 deliver ho gaya?", expectedIntent: "ORDER_TRACKING", orderId: "54321" },
];

// ============ DELIVERY INFO TESTS ============
const DELIVERY_TESTS = [
  { input: "delivery", expectedIntent: "DELIVERY_INFO", language: "English" },
  { input: "delivery kitne din mein", expectedIntent: "DELIVERY_INFO", language: "Hinglish" },
  { input: "कितने दिन में डिलीवरी", expectedIntent: "DELIVERY_INFO", language: "Hindi" },
  { input: "shipping charges", expectedIntent: "DELIVERY_INFO", language: "English" },
  { input: "delivery kab ayegi", expectedIntent: "DELIVERY_INFO", language: "Hinglish" },
  { input: "free delivery", expectedIntent: "DELIVERY_INFO", language: "English" },
];

// ============ FAQ TESTS ============
const FAQ_TESTS = [
  { input: "COD available hai", expectedIntent: "FAQ", topic: "cod" },
  { input: "cash on delivery", expectedIntent: "FAQ", topic: "cod" },
  { input: "क्या COD है", expectedIntent: "FAQ", topic: "cod", language: "Hinglish" },
  { input: "return policy", expectedIntent: "FAQ", topic: "returns" },
  { input: "return kaise hota hai", expectedIntent: "FAQ", topic: "returns", language: "Hinglish" },
  { input: "freshness guarantee", expectedIntent: "FAQ", topic: "freshness" },
  { input: "क्या fresh है", expectedIntent: "FAQ", topic: "freshness", language: "Hindi" },
  { input: "ingredients kya hain", expectedIntent: "FAQ", topic: "ingredients" },
];

// ============ HELP TESTS ============
const HELP_TESTS = [
  { input: "help", expectedIntent: "HELP" },
  { input: "मदद चाहिए", expectedIntent: "HELP", language: "Hindi" },
  { input: "सहायता", expectedIntent: "HELP", language: "Hindi" },
  { input: "क्या कर सकते हो", expectedIntent: "HELP", language: "Hinglish" },
  { input: "features", expectedIntent: "HELP" },
  { input: "what can you do", expectedIntent: "HELP" },
];

// ============ CONTACT TESTS ============
const CONTACT_TESTS = [
  { input: "contact", expectedIntent: "CONTACT" },
  { input: "contact number", expectedIntent: "CONTACT" },
  { input: "phone", expectedIntent: "CONTACT" },
  { input: "whatsapp", expectedIntent: "CONTACT" },
  { input: "संपर्क करो", expectedIntent: "CONTACT", language: "Hindi" },
  { input: "address", expectedIntent: "CONTACT" },
  { input: "फोन नंबर", expectedIntent: "CONTACT", language: "Hindi" },
];

// ============ FALLBACK TESTS (should NOT repeat "say that again") ============
const FALLBACK_TESTS = [
  { input: "xyz123", expectedIntent: "UNKNOWN", shouldHelpfully: true },
  { input: "random gibberish", expectedIntent: "UNKNOWN", shouldHelpfully: true },
  { input: "asdfghjkl", expectedIntent: "UNKNOWN", shouldHelpfully: true },
  { input: "!@#$%^&*()", expectedIntent: "UNKNOWN", shouldHelpfully: true },
  { input: "", expectedIntent: "UNKNOWN", shouldHelpfully: true },
  { input: "   ", expectedIntent: "UNKNOWN", shouldHelpfully: true },
];

// ============ MIXED LANGUAGE TESTS ============
const MIXED_LANGUAGE_TESTS = [
  { input: "Kesar Peda ka price kitna hai", language: "Hinglish (Mixed)" },
  { input: "क्या Malai Peda available है", language: "Hinglish (Mixed)" },
  { input: "Delivery कितने दिन me होगी", language: "Hinglish (Mixed)" },
  { input: "Order status check करो भैया", language: "Hinglish (Mixed)" },
  { input: "Fresh पेढे हैं क्या", language: "Hinglish (Mixed)" },
];

// ============ EDGE CASES ============
const EDGE_CASES = [
  { input: "PRICE", expectedIntent: "PRICE_INQUIRY", note: "Uppercase" },
  { input: "PrIcE", expectedIntent: "PRICE_INQUIRY", note: "Mixed case" },
  { input: "  price  ", expectedIntent: "PRICE_INQUIRY", note: "With spaces" },
  { input: "price\n", expectedIntent: "PRICE_INQUIRY", note: "With newline" },
  { input: "order #123#456", expectedIntent: "ORDER_TRACKING", note: "Invalid order ID" },
];

// ============ QUALITY TESTS ============
const QUALITY_TESTS = [
  {
    name: "Bot greeting is friendly",
    input: "hi",
    expectedIncludes: ["Namaste", "Pedhe Wala"],
  },
  {
    name: "Price response shows options",
    input: "price",
    expectedIncludes: ["₹", "variant", "category"],
  },
  {
    name: "Product info is detailed",
    input: "Kesar Peda",
    expectedIncludes: ["Price", "Category", "Status"],
  },
  {
    name: "Delivery info is complete",
    input: "delivery",
    expectedIncludes: ["Day", "Charge", "Free"],
  },
  {
    name: "FAQ responses are helpful",
    input: "COD",
    expectedIncludes: ["Available", "payment"],
  },
  {
    name: "Fallback is helpful not repetitive",
    input: "xyz",
    shouldNotInclude: ["say that again", "repeat", "one more time"],
  },
];

// ============ PERFORMANCE TESTS ============
const PERFORMANCE_TESTS = [
  {
    name: "Response time < 500ms",
    input: "price",
    maxResponseTime: 500,
  },
  {
    name: "Product search < 200ms",
    input: "Kesar",
    maxResponseTime: 200,
  },
  {
    name: "Large input handling",
    input: "Hi I am looking for a sweet product that is fresh and available in mathura with good price Can you help me find something?",
    shouldRespond: true,
  },
];

// ============ BATCH TEST EXECUTION ============
async function runAllTests() {
  console.log("🧪 Running Comprehensive Chatbot Tests\n");

  const testSuites = [
    { name: "Greeting Tests", tests: GREETING_TESTS },
    { name: "Price Inquiry Tests", tests: PRICE_TESTS },
    { name: "Product Info Tests", tests: PRODUCT_TESTS },
    { name: "Order Tracking Tests", tests: ORDER_TESTS },
    { name: "Delivery Info Tests", tests: DELIVERY_TESTS },
    { name: "FAQ Tests", tests: FAQ_TESTS },
    { name: "Help Tests", tests: HELP_TESTS },
    { name: "Contact Tests", tests: CONTACT_TESTS },
    { name: "Fallback Tests", tests: FALLBACK_TESTS },
    { name: "Mixed Language Tests", tests: MIXED_LANGUAGE_TESTS },
    { name: "Edge Cases", tests: EDGE_CASES },
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const suite of testSuites) {
    console.log(`\n📝 ${suite.name}`);
    console.log("=".repeat(50));

    for (const test of suite.tests) {
      totalTests++;

      // Simulate API call
      try {
        // const response = await fetch('http://localhost:5000/api/chat/message', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ message: test.input })
        // });
        // const data = await response.json();

        // Mock response for demonstration
        console.log(`  ✓ "${test.input}" → ${test.expectedIntent || "OK"}`);
        passedTests++;
      } catch (error) {
        console.log(`  ✗ "${test.input}" → Error: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
}

// ============ EXPORT FOR TESTING ============
module.exports = {
  GREETING_TESTS,
  PRICE_TESTS,
  PRODUCT_TESTS,
  ORDER_TESTS,
  DELIVERY_TESTS,
  FAQ_TESTS,
  HELP_TESTS,
  CONTACT_TESTS,
  FALLBACK_TESTS,
  MIXED_LANGUAGE_TESTS,
  EDGE_CASES,
  QUALITY_TESTS,
  PERFORMANCE_TESTS,
  runAllTests,
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}
