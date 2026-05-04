import React, { useEffect, useMemo, useState } from "react";
import { CATEGORY_FILES } from "../constants/categoryFiles";
import type { Product } from "../types/Product";
import SideBar from "../components/SideBar";
import { useCart } from "../context/CartContext";
import ProductModal from "../components/ProductModal";
import { useNavigate, useLocation } from "react-router-dom";
import { FALLBACK_IMAGE_URL, resolveImageUrl } from "../utils/imageUrl";
import { API_BASE_URL } from "../utils/apiConfig";

const Categories: React.FC = () => {
  const location = useLocation();
  const initialCategory =
    (location.state?.selectedCategory as string) || "Classic Pedas";

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [Categories, setCategories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");

  // 🔥 NEW STATE FOR SIDEBAR
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const file = CATEGORY_FILES[selectedCategory];
    if (!file) return;

    setLoading(true);
    setError("");

    (async () => {
      try {
        const candidates = [
          `${API_BASE_URL}/categories/${file}`,
          `${API_BASE_URL.replace(/\/api$/i, "")}/api/categories/${file}`,
          `${window.location.origin}/api/categories/${file}`,
          `https://pedhe-backend.onrender.com/api/categories/${file}`,
        ];

        let res: Response | null = null;
        for (const url of candidates) {
          try {
            console.log("Trying category URL:", url);
            const r = await fetch(url);
            if (r.ok) {
              res = r;
              break;
            }
            console.warn("Category fetch returned non-ok for", url, r.status);
          } catch (err) {
            console.warn("Category fetch failed for", url, err);
          }
        }

        if (!res) {
          throw new Error(`Unable to fetch ${file} from any candidate URL`);
        }

        const { parseResponse } = await import("../utils/fetchUtils");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await parseResponse(res)) || {};
        setCategories(Array.isArray(data?.Categories) ? data.Categories : []);
      } catch (err) {
        setError(`Failed to load: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return Categories.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      let matchesPrice = true;
      if (priceFilter === "low") matchesPrice = p.price < 150;
      else if (priceFilter === "medium")
        matchesPrice = p.price >= 150 && p.price <= 300;
      else if (priceFilter === "high") matchesPrice = p.price > 300;

      return matchesSearch && matchesPrice;
    });
  }, [Categories, search, priceFilter]);

  const getImageUrl = (image?: string) => {
    return resolveImageUrl(image, FALLBACK_IMAGE_URL);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">

      {/* 🔥 SIDEBAR WITH DYNAMIC WIDTH */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } transition-all duration-300 flex-shrink-0`}
      >
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-gradient-to-b from-gray-50 to-white">

        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-center py-6 tracking-tight">
            {selectedCategory}
          </h1>

          {/* FILTERS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 pb-6 max-w-4xl">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              placeholder="Search pedas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
            >
              <option value="all">All Prices</option>
              <option value="low">Below ₹150</option>
              <option value="medium">₹150 – ₹300</option>
              <option value="high">Above ₹300</option>
            </select>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-200 transition group flex flex-col overflow-hidden"
                >
                  <div className="w-full h-44 overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(p.image)}
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE_URL)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-sm sm:text-base line-clamp-2">{p.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{p.category}</p>

                    <div className="flex justify-between mt-3">
                      <span className="text-yellow-600 font-bold">
                        ₹{p.price}
                      </span>
                      <span className="text-sm">
                        {p.availability ? "In stock" : "Out"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3">
                      <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs sm:text-sm font-semibold py-1.5 rounded-lg transition"
                        onClick={() =>
                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: getImageUrl(p.image),
                            qty: 1,
                            variant: "250g", // ✅ Default weight variant
                          })
                        }
                      >
                        Add
                      </button>

                      <button
                        className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold py-1.5 rounded-lg transition"
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            alert("Please login first to buy products! 🔐");
                            navigate("/login", { state: { from: "/categories" } });
                            return;
                          }
                          navigate("/checkout", {
                            state: { cart: [{ ...p, qty: 1 }] },
                          });
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Categories;