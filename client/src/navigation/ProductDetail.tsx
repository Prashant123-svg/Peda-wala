import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../utils/apiConfig";

interface Weight {
  label: string;
  multiplier: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  basePrice?: number;
  image: string;
  images?: string[];
  availability: boolean;
  weights?: Weight[];
}

const fallbackImg = "/images/placeholder.jpg";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Mapping of product slugs to their IDs for best sellers
const productSlugToId: Record<string, number> = {
  "mathura-ke-pedhe": 1,
  "kesar-pedhe": 2,
  "mawa-pedhe": 3,
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState("");
  const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);
  const [weights, setWeights] = useState<Weight[]>([
    { label: "250g", multiplier: 1 },
    { label: "500g", multiplier: 1.9 },
    { label: "1kg", multiplier: 3.7 },
  ]);

  const getImageUrl = (image: string | undefined): string => {
    if (!image) return fallbackImg;
    if (image.startsWith("http")) return image;
    return `${API_ORIGIN}${image}`;
  };

  // Scroll to top when product detail page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("Product ID not found");
      setLoading(false);
      return;
    }

    // Convert slug to ID if needed
    let productId = parseInt(id);
    if (isNaN(productId)) {
      // ID is a slug, convert it
      productId = productSlugToId[id] || 0;
      if (productId === 0) {
        setError("Product not found");
        setLoading(false);
        return;
      }
    }
    
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories/product/${productId}`);
        const { parseResponse } = await import("../utils/fetchUtils");
        if (!res.ok) throw new Error("Product not found");
        const data = (await parseResponse(res)) || {};
        console.log("✅ Product data:", data);
        setProduct(data);
        setMainImg(getImageUrl(data.image));
        
        // Set weights if available in product, otherwise use default
        if (data.weights && data.weights.length > 0) {
          setWeights(data.weights);
          setSelectedWeight(data.weights[0]);
        } else {
          setSelectedWeight(weights[0]);
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const { addToCart: addToCartContext } = useCart();

  const basePrice = product?.price || product?.basePrice || 0;
  const weightMultiplier = selectedWeight ? selectedWeight.multiplier : 1;
  const finalPrice = basePrice * weightMultiplier * qty;

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCartContext({
      id: product.id,
      name: `${product.name}${selectedWeight ? " - " + selectedWeight.label : ""}`,
      price: basePrice * weightMultiplier,
      image: mainImg,
      qty,
    });
    alert("Item added to cart ✅");
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first to buy products! 🔐");
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }
    handleAddToCart();
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="mt-3">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
          <p className="text-lg text-gray-600 mb-6">{error || "Product not found"}</p>
          <Link to="/" className="text-decoration-none">
            <button className="px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with back button */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span className="text-gray-400">/</span>
            <Link 
              to={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-blue-600 transition-colors"
            >
              {product.category}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">{product.name}</span>
          </nav>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Left: Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: "1/1", maxHeight: "500px" }}>
                <img
                  src={mainImg}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(getImageUrl(img))}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                      mainImg === getImageUrl(img)
                        ? "border-yellow-400 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col gap-6">
            {/* Title & Category */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 text-sm sm:text-base font-medium">{product.category}</p>
            </div>

            {/* Availability Badge */}
            <div>
              <span
                className={`inline-block px-4 py-2 rounded-full text-white font-semibold text-sm ${
                  product.availability
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >
                {product.availability ? "✓ In Stock" : "✗ Out of Stock"}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-base leading-relaxed">{product.description}</p>

            {/* Price */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <p className="text-gray-600 text-sm mb-2">Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-yellow-600">₹{finalPrice.toFixed(2)}</span>
                {weightMultiplier !== 1 && (
                  <span className="text-gray-500 text-sm">per {selectedWeight?.label}</span>
                )}
              </div>
            </div>

            {/* Weight Selection */}
            <div>
              <label className="block text-gray-900 font-semibold mb-3">Select Weight:</label>
              <div className="flex gap-2 flex-wrap">
                {weights.map((w) => (
                  <button
                    key={w.label}
                    onClick={() => setSelectedWeight(w)}
                    className={`px-4 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                      selectedWeight?.label === w.label
                        ? "bg-yellow-400 text-gray-900 shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <label className="block text-gray-900 font-semibold mb-3">Quantity:</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="px-6 py-2.5 font-bold text-gray-900 text-lg">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <div className="text-gray-700">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">₹{finalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.availability}
                className="flex-1 px-6 py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                ➕ Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.availability}
                className="flex-1 px-6 py-3.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-yellow-400">Product Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Product ID</p>
              <p className="text-xl font-bold text-gray-900">#{product.id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Category</p>
              <p className="text-xl font-bold text-gray-900">{product.category}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Base Price</p>
              <p className="text-xl font-bold text-yellow-600">₹{basePrice}/250g</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
