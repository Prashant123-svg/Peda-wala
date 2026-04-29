/**
 * 📦 Product Service - Live Product Data Integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductService {
  constructor() {
    this.allProducts = [];
    this.loadAllProducts();
  }

  /**
   * Load all products from JSON files
   */
  loadAllProducts() {
    try {
      const pedheJsonPath = path.join(__dirname, '../data/pedhe_json');
      
      const files = [
        'classic_pedas.json',
        'exotic_and_gourmet_pedas.json',
        'fruit-based_pedas.json',
        'health-conscious_pedas.json',
        'modern_fusion_pedas.json',
        'nutty_and_dry_fruit_pedas.json',
        'seasonal_and_festival_special_pedas.json'
      ];

      this.allProducts = [];

      files.forEach(file => {
        try {
          const filePath = path.join(pedheJsonPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          
          if (data.Categories && Array.isArray(data.Categories)) {
            this.allProducts.push(...data.Categories);
          }
        } catch (err) {
          console.error(`Error loading ${file}:`, err.message);
        }
      });

      console.log(`✅ Loaded ${this.allProducts.length} products`);
    } catch (err) {
      console.error('❌ Error loading products:', err.message);
    }
  }

  /**
   * Search products by name
   */
  searchByName(query) {
    if (!query) return [];

    const q = query.toLowerCase();
    return this.allProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  /**
   * Get products by category
   */
  getByCategory(category) {
    if (!category) return [];

    const c = category.toLowerCase();
    return this.allProducts.filter(p => 
      p.category.toLowerCase().includes(c)
    );
  }

  /**
   * Get all unique categories
   */
  getAllCategories() {
    const categories = new Set(this.allProducts.map(p => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get products in price range
   */
  getByPriceRange(minPrice, maxPrice) {
    return this.allProducts.filter(p => 
      p.price >= minPrice && p.price <= maxPrice
    );
  }

  /**
   * Get available products
   */
  getAvailableProducts() {
    return this.allProducts.filter(p => p.availability);
  }

  /**
   * Get price of specific product
   */
  getPrice(productName) {
    const product = this.searchByName(productName)[0];
    return product ? { name: product.name, price: product.price, currency: '₹' } : null;
  }

  /**
   * Get detailed product info
   */
  getProductDetails(productName) {
    const products = this.searchByName(productName);
    
    if (products.length === 0) {
      return null;
    }

    if (products.length === 1) {
      return products[0];
    }

    // Return all matches formatted
    return {
      matches: products.length,
      products: products
    };
  }

  /**
   * Get top products
   */
  getTopProducts(limit = 5) {
    return this.allProducts
      .filter(p => p.availability)
      .slice(0, limit);
  }

  /**
   * Generate product response for chatbot
   */
  generateProductResponse(productName) {
    const details = this.getProductDetails(productName);

    if (!details) {
      return `Sorry! "${productName}" हमारे पास उपलब्ध नहीं है। 😔\n\n**Available Varieties:**\n${this.getAllCategories().map(c => `• ${c}`).join('\n')}\n\nकौन सी category dekhना चाहते हो?`;
    }

    if (details.matches > 1) {
      const list = details.products
        .map(p => `• **${p.name}** - ₹${p.price} (${p.category})`)
        .join('\n');
      
      return `हमारे पास ये variants हैं:\n\n${list}\n\nकौन सा लेना चाहते हो? 🍯`;
    }

    const p = details;
    return `
🍯 **${p.name}**

**Price:** ₹${p.price}
**Category:** ${p.category}
**Status:** ${p.availability ? '✅ Available' : '❌ Out of Stock'}

**Description:** ${p.description}

क्या कोई और जानकारी चाहिए? 🤔
    `;
  }

  /**
   * Get formatted price list
   */
  getPriceList(category = null) {
    const products = category ? this.getByCategory(category) : this.getAvailableProducts();
    
    if (products.length === 0) {
      return 'No products found';
    }

    let response = `📋 **Price List**\n\n`;
    
    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.category]) {
        grouped[p.category] = [];
      }
      grouped[p.category].push(p);
    });

    for (const [cat, prods] of Object.entries(grouped)) {
      response += `**${cat}:**\n`;
      prods.forEach(p => {
        response += `• ${p.name} - ₹${p.price}\n`;
      });
      response += '\n';
    }

    return response;
  }

  /**
   * Check product availability
   */
  checkAvailability(productName) {
    const product = this.searchByName(productName)[0];
    
    if (!product) {
      return { found: false, message: `"${productName}" नहीं मिला 😔` };
    }

    if (product.availability) {
      return {
        found: true,
        available: true,
        message: `✅ ${product.name} available है! Price: ₹${product.price}`
      };
    } else {
      return {
        found: true,
        available: false,
        message: `❌ ${product.name} अभी out of stock है। कुछ दिन में available होगा। 🙏`
      };
    }
  }

  /**
   * Suggest products based on price
   */
  suggestByPrice(price) {
    const similar = this.allProducts.filter(p => 
      Math.abs(p.price - price) <= 100 && p.availability
    );

    if (similar.length === 0) {
      return null;
    }

    return {
      basePrice: price,
      suggestions: similar.slice(0, 5).map(p => ({
        name: p.name,
        price: p.price,
        category: p.category
      }))
    };
  }
}

export default new ProductService();
