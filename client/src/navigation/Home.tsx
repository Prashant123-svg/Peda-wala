import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import hero1 from "../assets/hero1.jpg";
import hero2 from "../assets/hero2.jpg";
import { BiSolidOffer } from "react-icons/bi";
import { useCart } from "../context/CartContext";
import { API_ORIGIN } from "../utils/apiConfig";

const fallbackImg = `${API_ORIGIN}/images/products/pedhe.jpeg`;

const getImageUrl = (image: string) => {
  const safeImage = image.replace(/\\/g, "/").trim();
  if (safeImage.startsWith("http")) return encodeURI(safeImage);
  if (safeImage.startsWith("/")) return encodeURI(`${API_ORIGIN}${safeImage}`);
  return encodeURI(`${API_ORIGIN}/${safeImage}`);
};

const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackImg;
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Scroll to bestsellers if navigated with ?section=bestsellers or #bestsellers
  useEffect(() => {
    const hash = location.hash;
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section') || hash.replace('#', '');
    
    if (section === 'bestsellers') {
      setTimeout(() => {
        const element = document.getElementById('bestsellers');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);
  
  const categories = [
    {
      id: 1,
      name: "Mix Peda Box",
      categoryName: "Classic Pedas",
      image: "/images/products/pedhe.jpeg",
    },
    {
      id: 2,
      name: "Special Namkeen Mixtures",
      categoryName: "Nutty & Dry Fruit Pedas",
      image: "/images/products/dry_fruit_sweet.jpeg",
    },
    {
      id: 3,
      name: "Festive Gift Pack",
      categoryName: "Seasonal Pedas",
      image: "/images/products/festive_special.jpeg",
    },
    {
      id: 4,
      name: "Family Combo Pack",
      categoryName: "Modern Fusion Pedas",
      image: "/images/products/gift_pack.jpeg",
    },
  ];

  // ✅ Best Sellers = Only Pedhe varieties
  const bestSellers = [
    {
      id: 1,
      name: "Mathura ke Pedhe",
      price: "₹412",
      link: "/product/mathura-ke-pedhe",
      image: "/images/best_seller/mathura_ke_pedhe.jpeg",
    },
    {
      id: 2,
      name: "Kesar Pedhe",
      price: "₹450",
      link: "/product/kesar-pedhe",
      image: "/images/best_seller/kesar_peda.jpeg",
    },
    {
      id: 3,
      name: "Mawa Pedhe",
      price: "₹430",
      link: "/product/mawa-pedhe",
      image: "/images/best_seller/mawa.jpeg",
    },
  ];

  const usps = [
    {
      id: 1,
      title: "100% Pure & Fresh ingredients",
      subTitle: "No compromise with health",
      link: "/about#ingredients",
    },
    {
      id: 2,
      title: "Traditional Recipes",
      subTitle: "Old is gold",
      link: "/about#recipes",
    },
    {
      id: 3,
      title: "Secure Packaging",
      subTitle: "Lesser damage",
      link: "/about#packaging",
    },
  ];

  const heroSlides = [
    {
      heading: "Mithaas jo dil jeet le",
      subheading: "Mathura ke asli pedhe - ghar jaisa taste, taiyar delivery.",
      image: hero2,
      alt: "Traditional pedhe sweets",
    },
    {
      heading: "Traditional Taste, Modern Delivery",
      subheading: "Freshly crafted pedhe from Mathura, packed with purity and care.",
      image: hero1,
      alt: "Fresh pedhe assortment",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, [heroSlides.length]);

  const { addToCart: addToCartContext } = useCart();

  const handleAddToCart = (p: {
    id: number;
    name: string;
    price: string;
    image: string;
  }) => {
    addToCartContext({
      id: p.id,
      name: p.name,
      // bestSellers me price string hai like "₹412", usko number banana hoga
      price: Number(p.price.replace(/[^0-9]/g, "")),
      image: p.image ? p.image : fallbackImg,
      qty: 1,
      variant: "250g", // ✅ Default weight variant
    });
    alert("Item added to cart ✅ (250g)");
  };

  return (
    <div className="home-page w-full min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="w-full relative h-[360px] xs:h-[400px] sm:h-[470px] md:h-[540px] lg:h-[610px] mb-6 sm:mb-8 lg:mb-12 overflow-hidden"
      >
        {heroSlides.map((slide, index) => (
          <img
            key={slide.heading}
            src={slide.image}
            alt={slide.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,15,0.78)_0%,rgba(10,16,26,0.58)_38%,rgba(10,16,26,0.18)_72%,rgba(10,16,26,0.06)_100%)]"></div>
        <div className="relative w-full h-full px-4 xs:px-5 sm:px-8 lg:px-12 xl:px-16 flex items-center text-white">
          <div className="max-w-3xl w-full text-left">
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-3 sm:mb-4 leading-[1.05]">
              {heroSlides[currentSlide].heading}
            </h1>
            <p className="mb-6 sm:mb-8 text-lg xs:text-xl sm:text-2xl leading-relaxed text-gray-100 max-w-2xl">
              {heroSlides[currentSlide].subheading}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link to="/Categories" className="text-decoration-none text-reset">
                <button className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-[4px] bg-white text-[#0f172a] font-semibold text-base sm:text-lg shadow-[0_10px_25px_rgba(0,0,0,0.18)] hover:bg-slate-100">
                  Order Now
                </button>
              </Link>
              <Link to="/products" className="text-decoration-none text-reset">
                <button className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-[4px] bg-[#1e3a5f] text-white font-semibold text-base sm:text-lg shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:bg-[#244873]">
                  View Menu
                </button>
              </Link>
            </div>
            <div className="mt-5 sm:mt-6 flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.heading}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="w-full py-8 sm:py-12 lg:py-16 px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="w-full">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 text-gray-900 text-center">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {categories.map((c) => {
              const categorySlug = c.categoryName.toLowerCase().replace(/\s+/g, "-");
              return (
                <div
                  key={c.id}
                  onClick={() =>
                    navigate(`/category/${categorySlug}`, {
                      state: { category: c },
                    })
                  }
                  className="bg-white border border-gray-200 rounded-lg p-2 xs:p-3 sm:p-4 md:p-4 grid grid-cols-1 items-center text-center cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all"
                >
                  <img
                    src={getImageUrl(c.image)}
                    alt={c.name}
                    className="w-full aspect-square rounded-md bg-gray-200 mb-2 xs:mb-3 sm:mb-4 object-cover"
                    onError={handleImageError}
                  />
                <div className="text-xs xs:text-sm sm:text-sm md:text-base font-semibold text-gray-800 line-clamp-2">{c.name}</div>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section id="bestsellers" className="w-full bg-gray-50 py-8 sm:py-12 lg:py-16 px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="w-full">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 text-gray-900 text-center">🏆 Best Sellers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6">
              {bestSellers.map((p) => (
                <Link
                  key={p.id}
                  to={p.link}
                  className="text-decoration-none text-reset"
                >
                  <div className="bg-white border border-gray-200 rounded-lg p-3 xs:p-4 sm:p-5 cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all grid grid-cols-1 h-full">
                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="w-full aspect-square rounded-md bg-gray-200 mb-3 sm:mb-4 object-cover"
                      onError={handleImageError}
                    />
                    <div className="flex flex-col flex-grow">
                      <div className="font-semibold text-xs xs:text-sm sm:text-base text-gray-800">{p.name}</div>
                      <div className="text-sm xs:text-base sm:text-lg text-yellow-600 font-bold mt-1">{p.price}</div>
                      <button
                        className="mt-auto pt-3 xs:pt-4 w-full px-3 py-1.5 xs:py-2 border border-yellow-400 rounded text-xs xs:text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 text-black transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(p);
                        }}
                      >
                        ➕ Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </div>
      </section>

      {/* Why Choose Us / USPs */}
      <section className="w-full py-8 sm:py-12 lg:py-16 px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="w-full">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 text-gray-900 text-center">Why Choose Pedhe Wala?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6">
            {usps.map((u) => (
              <div
                key={u.id}
                className="border border-gray-200 rounded-lg p-4 sm:p-5 flex items-start gap-3 hover:shadow-md hover:border-yellow-400 transition-all bg-white"
              >
                <div className="text-2xl xs:text-3xl flex-shrink-0">✓</div>
                <div className="flex-grow">
                  <div className="font-bold text-sm xs:text-base text-gray-900">{u.title}</div>
                  <div className="text-xs xs:text-sm text-gray-600 mt-1">{u.subTitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="w-full bg-yellow-50 py-8 sm:py-12 lg:py-16 px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="w-full">
          <h3 className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 text-gray-900 text-center">🎁 Special Offers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6">
          <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg transition-all">
            <div className="text-2xl xs:text-3xl flex-shrink-0">💳</div>
            <div>
              <div className="font-bold text-sm xs:text-base">Card Offer</div>
              <div className="text-xs xs:text-sm text-gray-600 mt-1">
                Pay via Credit/Debit Card and get 10% off
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg transition-all">
            <div className="text-2xl xs:text-3xl flex-shrink-0">📦</div>
            <div>
              <div className="font-bold text-sm xs:text-base">Combo Offer</div>
              <div className="text-xs xs:text-sm text-gray-600 mt-1">
                Buy 2 Gift Packs, Get 1 Free
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg transition-all">
            <div className="text-2xl xs:text-3xl flex-shrink-0">🎟️</div>
            <div>
              <div className="font-bold text-sm xs:text-base">Voucher Offer</div>
              <div className="text-xs xs:text-sm text-gray-600 mt-1">
                Shop above ₹2000 & get ₹200 voucher
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="w-full py-8 sm:py-12 lg:py-16 px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="w-full">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 md:mb-10 lg:mb-10 text-gray-900 text-center">How Can We Help?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6">
          <div className="border border-gray-200 rounded-lg p-5 sm:p-6 bg-gradient-to-br from-yellow-50 to-white cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all">
            <div className="text-3xl xs:text-4xl mb-3">📞</div>
            <div className="font-bold text-base xs:text-lg mb-2 text-gray-900">Contact Us</div>
            <div className="text-xs xs:text-sm text-gray-600 mb-4">
              Have questions? Call our support team
            </div>
            <a href="tel:+916398783975" className="text-yellow-600 hover:text-yellow-700 font-bold text-xs xs:text-sm">
              +91-6398-783-975 →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 sm:p-6 bg-gradient-to-br from-yellow-50 to-white cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all">
            <div className="text-3xl xs:text-4xl mb-3">📧</div>
            <div className="font-bold text-base xs:text-lg mb-2 text-gray-900">Email Support</div>
            <div className="text-xs xs:text-sm text-gray-600 mb-4">
              Reach out to us via email anytime
            </div>
            <a href="mailto:support@pedhewala.com" className="text-yellow-600 hover:text-yellow-700 font-bold text-xs xs:text-sm">
              Email Us →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 sm:p-6 bg-gradient-to-br from-yellow-50 to-white cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all">
            <div className="text-3xl xs:text-4xl mb-3">❓</div>
            <div className="font-bold text-base xs:text-lg mb-2 text-gray-900">Help & Support</div>
            <div className="text-xs xs:text-sm text-gray-600 mb-4">
              Find answers to common questions
            </div>
            <Link to="/help" className="text-yellow-600 hover:text-yellow-700 font-bold text-xs xs:text-sm no-underline">
              Get Help →
            </Link>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
