import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const INDIAN_STATES = [
  "Select a state",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const STATE_CITY_MAP: {[key: string]: string[]} = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Nellore", "Kurnool"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Nagaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Rajnandgaon"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhidham", "Junagadh"],
  "Haryana": ["Gurgaon", "Faridabad", "Hisar", "Rohtak", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Dhanbad", "Jamshedpur", "Giridih"],
  "Karnataka": ["Bangalore", "Kalyan", "Kolar", "Mangalore", "Belgaum", "Mysore"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura"],
  "Mizoram": ["Aizawl", "Lunglei"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Chandigarh", "Patiala", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Bikaner"],
  "Sikkim": ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruppur"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar"],
  "Tripura": ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Allahabad", "Ghaziabad", "Meerut", "Agra", "Mathura", "Varanasi"],
  "Uttarakhand": ["Dehradun", "Haldwani", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri"],
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

 // ✅ Step 1: Try getting from state or fallback to localStorage
const stored = localStorage.getItem("checkoutCart");
const { cart: storedCart } = stored ? JSON.parse(stored) : { cart: [] };
const { cart = storedCart || [] } = location.state || {};

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
   
  // ✅ Step 2: Save cart to localStorage for persistence
useEffect(() => {
  if (cart && cart.length > 0) {
    localStorage.setItem("checkoutCart", JSON.stringify({ cart }));
  }
}, [cart]);


  // Address
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    state: "",
    city: "",
    pincode: "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Total calculation
  const totalAmount = cart.reduce(
    (sum: number, item: any) => sum + item.price * item.qty,
    0
  );

  const getItemWeightLabel = (item: any): string => {
    // First check if variant (weight) exists - this is set when adding to cart
    if (item?.variant) {
      const variant = String(item.variant).trim();
      if (variant && variant !== "undefined" && variant.length > 0) {
        return variant;
      }
    }

    // Second attempt: Extract from product name
    if (item?.name) {
      const name = String(item.name);
      
      // Try different regex patterns to catch weights
      // Pattern 1: "250g", "1kg" with dash separator
      let match = name.match(/[–\-\s]+(\d+(?:\.\d+)?)\s*(kg|g|gm)\b/i);
      if (match) {
        return `${match[1]}${match[2].toLowerCase()}`;
      }
      
      // Pattern 2: Any occurrence of number+unit
      match = name.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm)\b/i);
      if (match) {
        return `${match[1]}${match[2].toLowerCase()}`;
      }
    }

    // Default to 250g (most common weight and what quick-add uses)
    return "250g";
  };

  // Validate address fields
  const validateAddress = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!address.name.trim()) {
      newErrors.name = "Full Name is required";
    }
    if (!address.phone.trim()) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone Number must be 10 digits";
    }
    if (!address.street.trim()) {
      newErrors.street = "Street Address is required";
    }
    if (!address.state || address.state === "Select a state") {
      newErrors.state = "State is required";
    }
    if (!address.city) {
      newErrors.city = "City is required";
    }
    if (!address.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(address.pincode.replace(/\D/g, ""))) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate payment details
  const validatePayment = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (paymentMethod === "UPI" && !paymentDetails.upi) {
      newErrors.upi = "UPI ID is required";
    } else if (paymentMethod === "UPI" && !/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(paymentDetails.upi)) {
      newErrors.upi = "Invalid UPI ID format (e.g. name@upi)";
    }
    
    if (paymentMethod === "CARD" && !paymentDetails.cardNumber) {
      newErrors.cardNumber = "Card number is required";
    } else if (paymentMethod === "CARD" && !/^\d{16}$/.test(paymentDetails.cardNumber?.replace(/\s/g, ""))) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }
    
    if (paymentMethod === "CARD" && !paymentDetails.cardExpiry) {
      newErrors.cardExpiry = "Expiry date is required";
    } else if (paymentMethod === "CARD" && !/^\d{2}\/\d{2}$/.test(paymentDetails.cardExpiry)) {
      newErrors.cardExpiry = "Use MM/YY format";
    }
    
    if (paymentMethod === "CARD" && !paymentDetails.cardCVV) {
      newErrors.cardCVV = "CVV is required";
    } else if (paymentMethod === "CARD" && !/^\d{3,4}$/.test(paymentDetails.cardCVV)) {
      newErrors.cardCVV = "CVV must be 3 or 4 digits";
    }
    
    if (paymentMethod === "NETBANKING" && !paymentDetails.bank) {
      newErrors.bank = "Bank selection is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle fake payment processing for Card and Net Banking
  const handleFakePayment = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setProcessingPayment(true);
      
      // Simulate payment processing with random delay
      const processingTime = Math.random() * 2000 + 2000; // 2-4 seconds
      
      setTimeout(() => {
        setProcessingPayment(false);
        // 95% success rate for demo
        const isSuccess = Math.random() > 0.05;
        resolve(isSuccess);
      }, processingTime);
    });
  };

//confirmorder - create in database
const handleConfirmOrder = async () => {
  if (!address.name || !address.phone || !address.street || !address.city || !address.pincode) {
    setError("Please fill in all address fields");
    return;
  }

  if (cart.length === 0) {
    setError("Cart is empty");
    return;
  }

  try {
    // Simulate payment processing for CARD and NETBANKING
    if (paymentMethod === "CARD" || paymentMethod === "NETBANKING") {
      const paymentSuccess = await handleFakePayment();
      if (!paymentSuccess) {
        setError("Payment declined. Please try again with a different payment method.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const totalAmount = cart.reduce(
      (sum: number, item: any) => sum + item.price * item.qty,
      0
    );

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    
    if (!token) {
      setError("Please login to place an order");
      setLoading(false);
      return;
    }

    const apiUrl = import.meta.env.DEV 
      ? "http://localhost:5000/api/orders/create-order"
      : "/api/orders/create-order";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart,
        totalPrice: totalAmount,
        deliveryAddress: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        phoneNumber: address.phone,
        paymentMethod,
      }),
    });

    // Safely parse response body (handles empty responses or non-JSON)
    const parseResponse = async (res: Response) => {
      const text = await res.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        return { raw: text };
      }
    };

    if (!response.ok) {
      const errorData = await parseResponse(response);
      throw new Error((errorData && (errorData.message || errorData.msg)) || `Failed to create order (HTTP ${response.status})`);
    }

    const data = (await parseResponse(response)) || {};
    console.log("Order created in database:", data);

    // Clear cart and localStorage
    clearCart();
    localStorage.removeItem("checkoutCart");

    // Build order summary
    const order = {
      items: cart,
      address: {
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        pincode: address.pincode,
      },
      paymentMethod,
      orderId: data.order?._id || Date.now(),
      total: totalAmount,
    };

    // Save last order to localStorage so the confirmation page can recover if user refreshes
    try {
      localStorage.setItem("lastOrder", JSON.stringify(order));
    } catch (e) {
      console.warn("Could not persist lastOrder:", e);
    }

    // Navigate to confirmation and include orderId in query string for robustness
    const orderId = data.order?._id;
    if (orderId) {
      navigate(`/order-confirmation?orderId=${orderId}`, { state: order });
    } else {
      navigate("/order-confirmation", { state: order });
    }
  } catch (err: any) {
    console.error("Error placing order:", err);
    setError(err.message || "Failed to place order");
  } finally {
    setLoading(false);
  }
};
  // Stepper UI
  const StepIndicator = () => {
    const steps = ["Address", "Payment", "Review"];
    const progress = ((step - 1) / (steps.length - 1)) * 100;

    return (
      <div className="relative mb-8">
        <div className="absolute top-5 left-0 h-1 bg-gray-300 w-full rounded"></div>
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500 rounded"
          style={{ width: `${progress}%` }}
        ></div>
        <div className="flex justify-between relative z-10">
          {steps.map((s, i) => {
            const current = i + 1;
            return (
              <div key={s} className="text-center flex-1">
                <div
                  className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step === current
                      ? "bg-green-600 text-white scale-110"
                      : step > current
                      ? "bg-green-400 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {current}
                </div>
                <p className="mt-2 text-sm">{s}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">No items in cart.</div>
    );
  }

  return (
    <div className="checkout-page min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left - Main Form */}
      <div className="lg:col-span-2 mx-auto w-full max-w-md sm:max-w-lg">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">Checkout</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-start">
            <span>{error}</span>
            <button 
              className="text-red-700 hover:text-red-900 text-xl"
              onClick={() => setError("")}
            >
              ✕
            </button>
          </div>
        )}

        <StepIndicator />

        {/* STEP 1: Address */}
        {step === 1 && (
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Shipping Address</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => {
                    setAddress({ ...address, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.name ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Phone"
                  value={address.phone}
                  onChange={(e) => {
                    setAddress({ ...address, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Street Address"
                  value={address.street}
                  onChange={(e) => {
                    setAddress({ ...address, street: e.target.value });
                    if (errors.street) setErrors({ ...errors, street: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.street ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={address.state}
                    onChange={(e) => {
                      setAddress({ ...address, state: e.target.value, city: "" });
                      if (errors.state) setErrors({ ...errors, state: "" });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white ${errors.state ? "border-red-500" : "border-gray-300"}`}
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state === "Select a state" ? "" : state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                
                <div>
                  <select
                    value={address.city}
                    onChange={(e) => {
                      setAddress({ ...address, city: e.target.value });
                      if (errors.city) setErrors({ ...errors, city: "" });
                    }}
                    disabled={!address.state}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white ${errors.city ? "border-red-500" : "border-gray-300"} ${!address.state ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Select a city</option>
                    {address.state && STATE_CITY_MAP[address.state] ? (
                      STATE_CITY_MAP[address.state].map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))
                    ) : (
                      <option disabled>Please select a state first</option>
                    )}
                  </select>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={(e) => {
                    setAddress({ ...address, pincode: e.target.value });
                    if (errors.pincode) setErrors({ ...errors, pincode: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.pincode ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
              </div>

              <button
                onClick={() => {
                  if (validateAddress()) {
                    setStep(2);
                  }
                }}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg shadow-md font-semibold transition-colors text-sm sm:text-base"
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Payment Method</h3>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPaymentDetails({});
                setErrors({});
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-sm sm:text-base bg-white"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="NETBANKING">Net Banking</option>
            </select>

            {paymentMethod === "COD" && (
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Pay with Cash at the time of delivery.
              </p>
            )}

            {paymentMethod === "UPI" && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g. name@upi)"
                  value={paymentDetails.upi || ""}
                  onChange={(e) => {
                    setPaymentDetails({ ...paymentDetails, upi: e.target.value });
                    if (errors.upi) setErrors({ ...errors, upi: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.upi ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.upi && <p className="text-red-500 text-sm mt-1">{errors.upi}</p>}
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="mb-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-xs sm:text-sm font-semibold">🎭 DEMO MODE - Use test card: 4111111111111111</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="Enter 16-digit card number"
                    value={paymentDetails.cardNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setPaymentDetails({ ...paymentDetails, cardNumber: value });
                      if (errors.cardNumber) setErrors({ ...errors, cardNumber: "" });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.cardNumber ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentDetails.cardExpiry || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setPaymentDetails({ ...paymentDetails, cardExpiry: value });
                        if (errors.cardExpiry) setErrors({ ...errors, cardExpiry: "" });
                      }}
                      maxLength={5}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.cardExpiry ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.cardExpiry && <p className="text-red-500 text-sm mt-1">{errors.cardExpiry}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="CVV"
                      value={paymentDetails.cardCVV || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPaymentDetails({ ...paymentDetails, cardCVV: value });
                        if (errors.cardCVV) setErrors({ ...errors, cardCVV: "" });
                      }}
                      maxLength={4}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.cardCVV ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.cardCVV && <p className="text-red-500 text-sm mt-1">{errors.cardCVV}</p>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "NETBANKING" && (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-xs sm:text-sm font-semibold">🎭 DEMO MODE - Select any bank to proceed</p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Bank</label>
                <select
                  value={paymentDetails.bank || ""}
                  onChange={(e) => {
                    setPaymentDetails({ ...paymentDetails, bank: e.target.value });
                    if (errors.bank) setErrors({ ...errors, bank: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white ${errors.bank ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Choose a bank</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                  <option value="SBI">State Bank of India (SBI)</option>
                  <option value="BKID">Bank of India</option>
                  <option value="PNB">Punjab National Bank (PNB)</option>
                  <option value="KOTAK">Kotak Mahindra Bank</option>
                  <option value="YES">YES Bank</option>
                  <option value="IDFC">IDFC Bank</option>
                  <option value="RBL">RBL Bank</option>
                </select>
                {errors.bank && <p className="text-red-500 text-sm mt-1">{errors.bank}</p>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-3 px-6 rounded-lg shadow-md font-semibold transition-colors text-sm sm:text-base"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (validatePayment()) {
                    setStep(3);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg shadow-md font-semibold transition-colors text-sm sm:text-base"
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Review Your Order</h3>

            <div className="border-b pb-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Shipping Address</h4>
              <p className="text-sm text-gray-600">
                {address.name}, {address.phone}, {address.street}, {address.state}, {address.city} - {address.pincode}
              </p>
            </div>

            <div className="border-b pb-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Payment Method</h4>
              <p className="text-sm text-gray-600">{paymentMethod}</p>
            </div>

            {/* All Cart Items */}
            <div className="space-y-3 border-b pb-3">
              {cart.map((item: any, idx: number) => (
                <div key={`${item.id}-${item.variant || idx}`} className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Qty: {item.qty}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold text-xs">
                        {getItemWeightLabel(item)}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 mt-1">₹{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{totalAmount}</span>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setStep(2);
                  setErrors({});
                }}
                className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-6 rounded-lg shadow"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg shadow"
              >
                {loading ? "Processing..." : "Confirm Order ✅"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Order Summary */}
      <div className="hidden lg:block bg-white p-5 rounded-2xl shadow-md h-fit sticky top-20">
        <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
        <div className="space-y-3 border-b pb-3">
          {cart.map((item: any, idx: number) => (
            <div key={`${item.id}-${item.variant || idx}`} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-gray-600">Qty: {item.qty}</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold text-xs">
                    {getItemWeightLabel(item)}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 mt-1">₹{item.price * item.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>
      </div>

      {/* Payment Processing Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-block">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 mb-6">Please wait while we process your {paymentMethod} payment...</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Verifying payment details</p>
              <p>✓ Processing transaction</p>
              <p>⏳ Confirming order</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Checkout;
