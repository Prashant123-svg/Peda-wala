import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import connectDB from "./config/db.js";
import categoryRoutes from "./routes/categories.js";
import subscriberRoutes from "./routes/subscriber.js"; 
import otpRoutes from "./routes/otp.js";
import ordersRoutes from "./routes/orders.js";
import orderManagementRoutes from "./routes/orderManagement.js";
import orderStatusManagementRoutes from "./routes/orderStatusManagement.js";
import roleRequestRoutes from "./routes/roleRequest.js";
import profileCompletionRoutes from "./routes/profileCompletion.js";
import deliveryManagement from "./routes/deliveryManagement.js";
import chatbotRoutes from "./routes/chatbot.js";


dotenv.config();

// ✅ ES module fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
connectDB();

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subscribe", subscriberRoutes); 
app.use("/api/otp", otpRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/order-management", orderManagementRoutes);
app.use("/api/order-status", orderStatusManagementRoutes);
app.use("/api/role", roleRequestRoutes);
app.use("/api/profile", profileCompletionRoutes);
app.use("/api/delivery", deliveryManagement);
app.use("/api/chat", chatbotRoutes);

// ✅ Debug: List all registered routes
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((nestedRoute) => {
        if (nestedRoute.route) {
          routes.push({
            method: Object.keys(nestedRoute.route.methods)[0].toUpperCase(),
            path: nestedRoute.route.path,
          });
        }
      });
    }
  });
  res.json({ routes, total: routes.length });
});

// ✅ Static files serve
app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/profile-documents", express.static(path.join(__dirname, "public", "profile-documents")));
app.use("/data", express.static(path.join(__dirname, "data", "pedhe_json")));
app.use("/products", express.static(path.join(__dirname, "data", "products_json")));

// ✅ JSON file paths
const ordersPath = path.join(__dirname, "data", "past_orders_json");
const productsPath = path.join(__dirname, "data", "products_json");
const categoriesPath = path.join(__dirname, "data", "pedhe_json");

// ✅ Utility function (safe JSON read)
function readJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      return [];
    }
  } catch (err) {
    console.error("❌ Error reading JSON:", err);
    return [];
  }
}

// ✅ Dialogflow Webhook Helper Functions
function getProductByName(productName) {
  if (!productName) return null;
  
  const allProducts = getAllProducts();
  const found = allProducts.find(p => 
    p.name?.toLowerCase().includes(productName.toLowerCase())
  );
  
  console.log(`🔍 Searching for "${productName}": ${found ? 'Found' : 'Not found'}`);
  return found;
}

function getAllProducts() {
  const allProducts = [];
  const pedheDir = path.join(__dirname, "data", "pedhe_json");
  
  try {
    if (!fs.existsSync(pedheDir)) {
      console.log("❌ pedhe_json directory not found at:", pedheDir);
      return allProducts;
    }
    
    const pedheFiles = fs.readdirSync(pedheDir).filter(f => f.endsWith('.json'));
    console.log("📂 Found JSON files in pedhe_json:", pedheFiles);
    
    pedheFiles.forEach(file => {
      const filePath = path.join(pedheDir, file);
      try {
        const data = readJSON(filePath);
        console.log(`📖 Loading ${file}: found ${data.Categories?.length || 0} items`);
        if (data.Categories && Array.isArray(data.Categories)) {
          allProducts.push(...data.Categories);
        }
      } catch (err) {
        console.error(`❌ Error loading ${file}:`, err.message);
      }
    });
  } catch (err) {
    console.error("❌ Error reading pedhe_json directory:", err.message);
  }
  
  console.log(`✅ Total products loaded: ${allProducts.length}`);
  return allProducts;
}

function formatProductInfo(product) {
  if (!product) return null;
  return `${product.name} - ₹${product.price} | ${product.description} | Availability: ${product.availability ? "✓ Available" : "❌ Out of Stock"}`;
}

function getProductCategories() {
  const categories = new Set();
  const allProducts = getAllProducts();
  allProducts.forEach(p => categories.add(p.category));
  return Array.from(categories);
}

// ✅ Dialogflow Webhook endpoint
app.post("/api/dialogflow", (req, res) => {
  const intent = req.body.queryResult?.intent?.displayName;
  const queryText = req.body.queryResult?.queryText?.toLowerCase() || "";
  const parameters = req.body.queryResult?.parameters || {};
  let reply = "Maaf kijiye, mujhe samajh nahi aaya. Kya aap 'Help' bol sakte hain?";

  console.log("📥 Webhook Request - Intent:", intent);

  // ✅ Handle different intents
  if (intent === "Greeting" || intent === "WELCOME") {
    reply = "🙏 Namaste! Main Pedhe Wala Bot hoon. Kya aapko product info, pricing, ya order tracking chahiye? 'Help' boliye!";
  }
  
  else if (intent === "Help" || intent === "DEFAULT_WELCOME_INTENT") {
    reply = `📋 Main yeh kar sakta hoon:\n` +
      `1️⃣ Product details - kisi bhi peda ka naam boliye\n` +
      `2️⃣ Categories - sab categories dekhiye\n` +
      `3️⃣ Pricing - price ke bare mein jaankari\n` +
      `4️⃣ Order tracking - apna order track kariye\n` +
      `5️⃣ Delivery info - delivery ke bare mein\n` +
      `Kya main aapki madad kar sakta hoon?`;
  }

  else if (intent === "Product Info" || intent === "product_inquiry") {
    let productName = parameters?.product_name || "";
    
    if (productName) {
      const product = getProductByName(productName);
      if (product) {
        reply = `✨ ${formatProductInfo(product)}`;
      } else {
        reply = `Maaf kijiye, "${productName}" abhi hamare paas available nahi hai. Kya aap koi dusra peda dekhna chahenge?`;
      }
    } else {
      const allProducts = getAllProducts();
      if (allProducts.length > 0) {
        const featured = allProducts.slice(0, 3);
        reply = `🍬 Hamare popular pedas:\n`;
        featured.forEach(p => {
          reply += `\n• ${p.name} - ₹${p.price}`;
        });
        reply += `\n\nKish aur janakari chahiye?`;
      } else {
        reply = "Maaf kijiye, abhi products ki list available nahi hai.";
      }
    }
  }

  else if (intent === "Category Listing" || intent === "category_info") {
    const categories = getProductCategories();
    if (categories.length > 0) {
      reply = `📂 Hamare sab categories:\n`;
      categories.forEach((cat, idx) => {
        reply += `\n${idx + 1}. ${cat}`;
      });
      reply += `\n\nKish category mein dekhlena chahte ho?`;
    } else {
      reply = "Abhi categories available nahi hain.";
    }
  }

  else if (intent === "Price Inquiry" || intent === "price_check") {
    let productName = parameters?.product_name || "";
    
    if (productName) {
      const product = getProductByName(productName);
      if (product) {
        reply = `💰 ${product.name} ka price: ₹${product.price}`;
      } else {
        reply = `"${productName}" ke liye price info available nahi hai.`;
      }
    } else {
      const allProducts = getAllProducts();
      const priceRange = allProducts.length > 0 
        ? { min: Math.min(...allProducts.map(p => p.price)), max: Math.max(...allProducts.map(p => p.price)) }
        : { min: 0, max: 0 };
      
      reply = `💰 Hamare products ka price range: ₹${priceRange.min} se ₹${priceRange.max} tak`;
    }
  }

  else if (intent === "Order Tracking" || intent === "order_status") {
    const orderId = parameters?.order_id || "";
    const orders = readJSON(ordersPath);
    
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id?.toString() === orderId);
      if (order) {
        reply = `📦 Order #${orderId} ka status:\n` +
          `Status: ${order.status || "Processing"}\n` +
          `Date: ${order.date || "N/A"}\n` +
          `Items: ${order.items?.length || 0}`;
      } else {
        reply = `Order #${orderId} nahi mila. Kya aap order ID dobara de sakte ho?`;
      }
    } else if (orders.length > 0) {
      reply = `📦 Aapka last order:\n` +
        `Status: ${orders[0].status || "Processing"}\n` +
        `Date: ${orders[0].date || "N/A"}`;
    } else {
      reply = "Abhi aapke koi order record nahi mile.";
    }
  }

  else if (intent === "Delivery Info" || intent === "delivery_inquiry") {
    reply = `🚚 Delivery Information:\n` +
      `📍 Free Delivery: ₹500 se zyada orders par\n` +
      `⏱️ Delivery Time: 3-5 business days\n` +
      `🌍 Coverage: Pan India delivery available\n` +
      `📞 Delivery tracking aapko SMS se milega\n\n` +
      `Kya aur kuch jaankari chahiye?`;
  }

  else if (intent === "Contact" || intent === "contact_info") {
    reply = `📞 Contact Us:\n` +
      `📱 Phone: +91-XXXX-XXXX-XX\n` +
      `📧 Email: support@pedhewala.com\n` +
      `🕐 Timing: 10 AM - 7 PM (Mon-Sat)\n` +
      `📍 Address: Pedhe Wala, India\n\n` +
      `Hum aapki madad ke liye tayyar hain!`;
  }

  else if (intent === "Availability Check") {
    const allProducts = getAllProducts();
    const available = allProducts.filter(p => p.availability).length;
    reply = `✅ Abhi ${available} products available hain!`;
  }

  // ✅ Dialogflow response format
  res.json({ 
    fulfillmentText: reply,
    fulfillmentMessages: [
      {
        text: {
          text: [reply]
        }
      }
    ]
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Pedhe Wala API is running successfully",
    status: "OK"
  });
});

// ✅ 404 Handler (Debug)
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: "Route not found", 
    method: req.method,
    path: req.path 
  });
});

// ✅ Global Error Handler Middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  
  // Handle multer file upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({ 
      message: "File upload error", 
      error: err.message 
    });
  }
  
  // Handle validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ 
      message: "Validation error", 
      error: err.message 
    });
  }
  
  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ 
      message: "Invalid token", 
      error: err.message 
    });
  }
  
  // Handle MongoDB errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    return res.status(500).json({ 
      message: "Database error", 
      error: err.message 
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : "An error occurred"
  });
});

// ✅ Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 API Base: http://localhost:${PORT}/api`);
});

// ✅ Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

export default app;
