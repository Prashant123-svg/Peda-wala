import { useState } from "react";
import { BsInstagram, BsFacebook, BsYoutube, BsWhatsapp } from "react-icons/bs";
import { API_BASE_URL } from "../utils/apiConfig";
import { parseResponse } from "../utils/fetchUtils";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // handle subscribe
  const handleSubscribe = async () => {
    if (!email) {
      setMessage("Please enter a valid email");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await parseResponse(res)) || {};
      setMessage(data.message || String(data.raw || "Subscription response received"));
      setEmail(""); // clear input after success
    } catch (err) {
      setMessage("Something went wrong. Try again later.");
    }
  };

  return (
    <>
      <footer className="bg-gray-900 text-white py-8 sm:py-10 lg:py-12">
        <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {/* Categories */}
            <div className="col-span-1">
              <h5 className="text-sm sm:text-base font-bold text-yellow-400 mb-3 sm:mb-4">Categories</h5>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Milk Pedas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Dry Fruit Pedas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Chocolate Pedas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Regional Special
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Festival Pedas
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-span-1">
              <h5 className="text-sm sm:text-base font-bold text-yellow-400 mb-3 sm:mb-4">Support</h5>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Shipping Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Return Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    Terms & Conditions
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1">
              <h5 className="text-sm sm:text-base font-bold text-yellow-400 mb-3 sm:mb-4">Contact</h5>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start gap-1.5">
                  <span className="text-sm mt-0.5">📍</span>
                  <p className="text-xs sm:text-sm text-gray-300">Mathura, India</p>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sm mt-0.5">📞</span>
                  <a href="tel:+916398783975" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    +91 6398783975
                  </a>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sm mt-0.5">📱</span>
                  <a href="tel:+919720386529" className="text-xs sm:text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                    +91 97203 86529
                  </a>
                </li>
              </ul>
            </div>

            {/* About Us + Subscribe */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="border border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-800">
                <h4 className="text-sm sm:text-base font-bold text-yellow-400 mb-2 sm:mb-3">About Us</h4>
                <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
                  Hum Mathura ke traditional pedhe banate hain jo har festival ko khaas bana dete hain.
                </p>

                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Enter your email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-xs sm:text-sm rounded transition-colors"
                  type="button"
                  onClick={handleSubscribe}
                >
                  Subscribe
                </button>

                {/* Show success/error message */}
                {message && (
                  <p className="mt-2 text-xs sm:text-sm text-yellow-300">{message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-700">
            <p className="text-xs sm:text-sm text-center sm:text-left text-gray-400">© 2025 Pedhe Wala. All rights reserved.</p>
            <ul className="flex gap-4 sm:gap-6">
              <li>
                <a 
                  className="text-gray-300 hover:text-yellow-400 transition-colors" 
                  href="https://www.instagram.com/pedhe_wala?igsh=NTdqbWU5Yno5bzlu" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <BsInstagram size={20} className="hover:scale-110 transition-transform" />
                </a>
              </li>
              <li>
                <a 
                  className="text-gray-300 hover:text-yellow-400 transition-colors" 
                  href="https://m.facebook.com/profile.php?id=61581213934464" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <BsFacebook size={20} className="hover:scale-110 transition-transform" />
                </a>
              </li>
              <li>
                <a 
                  className="text-gray-300 hover:text-yellow-400 transition-colors" 
                  href="https://www.youtube.com/@pedhewala" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Youtube"
                >
                  <BsYoutube size={20} className="hover:scale-110 transition-transform" />
                </a>
              </li>
              <li>
                <a 
                  className="text-gray-300 hover:text-yellow-400 transition-colors" 
                  href="https://wa.me/916398783975" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Whatsapp"
                >
                  <BsWhatsapp size={20} className="hover:scale-110 transition-transform" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
