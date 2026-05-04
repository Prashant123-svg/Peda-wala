import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_BASE_URL, API_ORIGIN } from "../utils/apiConfig";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();

  const categories = [
    "Mix Peda Boxes",
    "Special Namkeen Mixtures",
    "Festive Gift Packs",
    "Family Combo Packs",
  ];

  useEffect(() => {
    (async () => {
      try {
        const candidates = [
          `${API_ORIGIN}/products/products.json`,
          `${API_ORIGIN}/api/products/products.json`,
          `${window.location.origin}/products/products.json`,
          `${window.location.origin}/api/products/products.json`,
          `https://pedhe-backend.onrender.com/products/products.json`,
        ];

        let res: Response | null = null;
        for (const url of candidates) {
          try {
            console.log("Trying products URL:", url);
            const r = await fetch(url);
            if (r.ok) {
              res = r;
              break;
            }
            console.warn("Products fetch returned non-ok for", url, r.status);
          } catch (err) {
            console.warn("Products fetch failed for", url, err);
          }
        }

        if (!res) {
          throw new Error("Unable to fetch products from any candidate URL");
        }

        const { parseResponse } = await import("../utils/fetchUtils");
        const data = (await parseResponse(res)) || [];
        const normalizedData = data.map((product: Product) => ({
          ...product,
          image: product.image.startsWith("http")
            ? product.image
            : `${API_ORIGIN}${product.image}`,
        }));
        setProducts(normalizedData);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    })();
  }, []);



  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
      variant: "250g", // ✅ Default weight variant
    });
    alert("Item added to cart ✅ (250g)");
  };

  const buyNow = (product: Product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first to buy products! 🔐");
      navigate("/login", { state: { from: "/products" } });
      return;
    }
    navigate("/checkout", { state: { cart: [{ ...product, qty: 1 }] } });
  };

  // Filter products globally by search
  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesCategory =
      category === "All Categories" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Get products for a section
  const getProductsByCategory = (cat: string) =>
    filteredProducts.filter((p) => p.category === cat);

  return (
    <div className="products-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-[1400px] mx-auto pt-6 sm:pt-8 lg:pt-10 pb-6 px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-3 xs:gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">Our Products</h2>
          <button 
            className="w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors text-xs sm:text-sm shadow-sm"
            onClick={() => navigate("/orders")}
          >
            🛒 Cart ({cart.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-2xl">
          <input
            type="text"
            className="w-full xs:max-w-sm px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm xs:text-base"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full xs:max-w-sm px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm xs:text-base"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            title="Filter products by category"
            aria-label="Product category filter"
          >
            <option value="All Categories">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products Sections */}
        {categories.length > 0 && categories.map((cat) => {
          const catProducts = getProductsByCategory(cat);
          if (catProducts.length === 0) return null;

          return (
            <div key={cat} className="mb-10 sm:mb-12 lg:mb-16">
              <h3 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 pb-3 border-b-2 border-yellow-400 text-center">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {catProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:border-yellow-400 border border-gray-200 transition-all overflow-hidden flex flex-col h-full cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="w-full h-44 bg-gray-200 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col flex-grow">
                      <h5 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug">{product.name}</h5>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2.5 flex-grow line-clamp-2">{product.description}</p>
                      <h6 className="text-lg sm:text-xl font-bold text-yellow-600 mb-2.5">₹{product.price}</h6>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          ➕ Add
                        </button>
                        <button
                          className="flex-1 px-2.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold text-xs rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            buyNow(product);
                          }}
                        >
                          ⚡ Buy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg font-semibold">No products found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
