import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { CATEGORY_FILES } from "../constants/categoryFiles";
import type { Product } from "../types/Product";
import { useCart } from "../context/CartContext";
import ProductModal from "../components/ProductModal";
import { FALLBACK_IMAGE_URL, resolveImageUrl } from "../utils/imageUrl";
import { API_BASE_URL } from "../utils/apiConfig";

// Utility function to convert product name to URL slug
const productNameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[&]/g, "and")
    .replace(/[^\w-]/g, "");
};

interface CategoryInfo {
  name: string;
  categoryName: string;
  image: string;
  description?: string;
}

const CategoryDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  
  let categoryInfo = location.state?.category as CategoryInfo | undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  // Fallback descriptions
  const descriptions: Record<string, string> = {
    "Classic Pedas":
      "Mathura ke asli pede — traditional taste with pure ingredients. Our classic pedas are made with milk solids, ghee, and natural flavors for an authentic experience.",
    "Nutty & Dry Fruit Pedas":
      "Premium pedas enriched with dry fruits and nuts. Each bite combines the traditional peda taste with the crunch and nutrition of almonds, cashews, and pistachios.",
    "Seasonal Pedas":
      "Festival specials and seasonal varieties crafted with care. Perfect for celebrations and special occasions.",
    "Modern Fusion Pedas":
      "Contemporary twists on traditional recipes. Blending heritage with innovation for a unique taste experience.",
    "Healthy Pedas":
      "Guilt-free indulgence with health-conscious ingredients. Crafted for those who want taste without compromise.",
    "Fruit Pedas": "Fruity flavors combined with traditional peda base. A refreshing take on classic sweets.",
    "Exotic Pedas":
      "Rare and premium varieties from around the world. Gourmet pedas for the discerning palate.",
  };

  useEffect(() => {
    // Try to find category name from URL slug
    let categoryName = categoryInfo?.categoryName;
    
    if (!categoryName && name) {
      // Convert slug back to category name
      const slugToName: Record<string, string> = {
        "classic-pedas": "Classic Pedas",
        "nutty-dry-fruit-pedas": "Nutty & Dry Fruit Pedas",
        "seasonal-pedas": "Seasonal Pedas",
        "modern-fusion-pedas": "Modern Fusion Pedas",
        "healthy-pedas": "Healthy Pedas",
        "fruit-pedas": "Fruit Pedas",
        "exotic-pedas": "Exotic Pedas",
      };
      categoryName = slugToName[name] || name;
    }

    if (!categoryName) {
      setError("Category information not found");
      return;
    }

    const file = CATEGORY_FILES[categoryName];
    if (!file) {
      setError("Category not found");
      return;
    }

    setLoading(true);
    setError("");

    console.log(`🔄 Loading products from: ${file}`);

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories/${file}`);
        const { parseResponse } = await import("../utils/fetchUtils");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await parseResponse(res)) || {};
        console.log(`✅ API Response:`, data);
        const productsArray = Array.isArray(data?.Categories) ? data.Categories : [];
        console.log(`📦 Total products loaded: ${productsArray.length}`);
        setProducts(productsArray);
        if (productsArray.length === 0) {
          setError("No products found in this category");
        }
      } catch (err) {
        console.error(`❌ Error:`, err);
        setError(`Failed to load products: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryInfo, name]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <Link to="/" className="text-decoration-none">
            <button className="px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Category Details</h1>
        <p className="text-gray-600 mb-4">Loading category information...</p>
        <Link to="/" className="text-decoration-none">
          <button className="px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  const { addToCart } = useCart();

  const getImageUrl = (image: string | undefined): string => {
    return resolveImageUrl(image, FALLBACK_IMAGE_URL);
  };

  const handleAddToCart = (p: Product) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: getImageUrl(p.image),
      qty: 1,
      variant: "250g", // ✅ Default weight variant
    });
    alert("Item added to cart ✅ (250g)");
  };

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="category-detail-page">
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white page-section">
      {/* Hero Banner */}
      <div
        className="relative h-96 bg-cover bg-center hero-aligned"
        style={{ backgroundImage: `url(${categoryInfo.image})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl font-bold mb-2 text-center">{categoryInfo.name}</h1>
          <p className="text-xl max-w-2xl text-center">
            {descriptions[categoryInfo.categoryName] || "Premium quality products"}
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex justify-start max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          ← Back
        </button>
      </div>

      {/* Search & Filter */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 border-b section-content max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[320px] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
          <span className="text-gray-500 text-sm">
            {filteredProducts.length} products
          </span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-gray-600">Loading products…</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 text-lg">
              No products found for "{search}"
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-100 p-3 mb-4 rounded text-gray-600 text-sm">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {filteredProducts.map((p) => (
                <div className="flex flex-col h-full" key={p.id}>
                  <div
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-200 transition-all cursor-pointer flex flex-col h-full overflow-hidden"
                    onClick={() => navigate(`/product/${productNameToSlug(p.name)}`)}
                  >
                    <div className="h-48 overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getImageUrl(p.image)}
                        onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE_URL)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="card-body d-flex flex-column p-3">
                      <h5 className="card-title mb-1 fw-bold" style={{ fontSize: "0.98rem", lineHeight: 1.3 }}>{p.name}</h5>
                      <p className="card-text text-muted small mb-2" style={{ lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.description}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="fw-bold text-warning" style={{ fontSize: "0.95rem" }}>
                          ₹{p.price}/250gm
                        </span>
                        <span
                          className={`badge ${
                            p.availability ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {p.availability ? "In stock" : "Out of stock"}
                        </span>
                      </div>
                    </div>
                    <div className="card-footer bg-white border-0 p-2 d-flex gap-2" style={{ borderTop: "1px solid #f2f2f2" }}>
                      <button
                        className="btn btn-warning flex-grow-1 btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(p);
                        }}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="btn btn-success flex-grow-1 btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${productNameToSlug(p.name)}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      </div>
    </div>
  );
};

export default CategoryDetail;
