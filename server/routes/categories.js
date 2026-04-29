// routes/categories.js

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Utility function to safely read JSON
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

// ✅ API: Get a single product by ID (searches all category files) - MUST BE BEFORE /:file
router.get("/product/:id", (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const dataDir = path.join(__dirname, "../data/pedhe_json");

    const files = fs.readdirSync(dataDir);
    
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(dataDir, file);
      const data = readJSON(filePath);
      
      if (data.Categories && Array.isArray(data.Categories)) {
        const product = data.Categories.find((p) => p.id === productId);
        if (product) {
          return res.json(product);
        }
      }
    }
    
    res.status(404).json({ error: "Product not found" });
  } catch (err) {
    console.error("❌ Error searching for product:", err);
    next(err); // Pass to error handler
  }
});

// ✅ API: Get products of a specific category
router.get("/:file", (req, res, next) => {
  try {
    const file = req.params.file; // e.g. "classic_pedas.json"
    const filePath = path.join(__dirname, "../data/pedhe_json", file);

    if (fs.existsSync(filePath)) {
      const data = readJSON(filePath);
      res.json(data);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.error("❌ Error reading category:", err);
    next(err); // Pass to error handler
  }
});

export default router;
