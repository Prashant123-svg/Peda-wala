// import React, { useState } from "react";
// import { addToCart, CartItem } from "../utils/cartUtils";
// import { X } from "lucide-react"; // ❌ close icon

// interface Product {
//   id: number;
//   name: string;
//   price: number; // base price
//   description: string;
//   images: string[];
//   weights?: { label: string; multiplier: number }[]; // example: 500g = 1x, 1kg = 1.8x
// }

// interface ProductModalProps {
//   product: Product | null;
//   onClose: () => void;
// }

// const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
//   const [qty, setQty] = useState(1);
//   const [selectedWeight, setSelectedWeight] = useState(
//     product?.weights ? product.weights[0] : null
//   );

//   if (!product) return null;

//   const basePrice = product.price;
//   const weightMultiplier = selectedWeight ? selectedWeight.multiplier : 1;
//   const finalPrice = basePrice * weightMultiplier * qty;

//   const handleAddToCart = () => {
//     const item: CartItem = {
//       id: product.id,
//       name: `${product.name}${selectedWeight ? " - " + selectedWeight.label : ""}`,
//       price: basePrice * weightMultiplier,
//       image: product.images[0],
//       qty,
//     };
//     addToCart(item);
//     alert("Added to cart ✅");
//     onClose();
//   };

//   const handleBuyNow = () => {
//     alert(`Proceed to buy ${product.name} for ₹${finalPrice}`);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative p-6 grid md:grid-cols-2 gap-6">
//         {/* ❌ Close button */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-600 hover:text-black"
//         >
//           <X size={28} />
//         </button>

//         {/* Left: Images */}
//         <div className="flex flex-col space-y-4">
//           <img
//             src={product.images[0]}
//             alt={product.name}
//             className="w-full h-80 object-cover rounded-lg shadow"
//           />
//           <div className="flex space-x-3 overflow-x-auto">
//             {product.images.map((img, i) => (
//               <img
//                 key={i}
//                 src={img}
//                 alt={`thumb-${i}`}
//                 className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500"
//                 onClick={() => {
//                   const imgs = [...product.images];
//                   [imgs[0], imgs[i]] = [imgs[i], imgs[0]];
//                   product.images = imgs;
//                 }}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Right: Info */}
//         <div className="flex flex-col justify-between">
//           <div>
//             <h2 className="text-3xl font-bold text-gray-800">{product.name}</h2>
//             <p className="mt-2 text-gray-600">{product.description}</p>

//             {/* Price */}
//             <p className="mt-4 text-2xl font-semibold text-green-600">
//               ₹{finalPrice.toFixed(2)}
//             </p>

//             {/* Weight selector */}
//             {product.weights && (
//               <div className="mt-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Weight
//                 </label>
//                 <select
//                   className="border rounded-lg p-2 w-40"
//                   value={selectedWeight?.label}
//                   onChange={(e) =>
//                     setSelectedWeight(
//                       product.weights?.find((w) => w.label === e.target.value) || null
//                     )
//                   }
//                 >
//                   {product.weights.map((w) => (
//                     <option key={w.label} value={w.label}>
//                       {w.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {/* Quantity selector */}
//             <div className="mt-4 flex items-center space-x-3">
//               <span className="text-sm font-medium text-gray-700">Quantity:</span>
//               <div className="flex items-center border rounded-lg">
//                 <button
//                   className="px-3 py-1 text-lg"
//                   onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}
//                 >
//                   -
//                 </button>
//                 <span className="px-4 py-1">{qty}</span>
//                 <button
//                   className="px-3 py-1 text-lg"
//                   onClick={() => setQty((q) => q + 1)}
//                 >
//                   +
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="mt-6 flex space-x-4">
//             <button
//               className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
//               onClick={handleAddToCart}
//             >
//               Add to Cart
//             </button>
//             <button
//               className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
//               onClick={handleBuyNow}
//             >
//               Buy Now
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductModal;

// import React, { useState } from "react";
// import { addToCart } from "../utils/cartUtils";

// interface Product {
//   id: number;
//   name: string;
//   category: string;
//   description: string;
//   price: number;
//   image: string; // main image
//   images?: string[]; // extra images
//   weights?: { label: string; multiplier: number }[];
//   availability: boolean;
// }

// const ProductModal = ({
//   product,
//   onClose,
// }: {
//   product: Product;
//   onClose: () => void;
// }) => {
//   const [qty, setQty] = useState(1);
//   const [selectedWeight, setSelectedWeight] = useState(
//     product.weights ? product.weights[0] : null
//   );
//   const [mainImg, setMainImg] = useState(
//     product.image ? `http://localhost:5000${product.image}` : "/images/placeholder.jpg"
//   );

//   const basePrice = product.price;
//   const weightMultiplier = selectedWeight ? selectedWeight.multiplier : 1;
//   const finalPrice = basePrice * weightMultiplier * qty;

//   const handleAddToCart = () => {
//     addToCart({
//       id: product.id,
//       name: `${product.name}${selectedWeight ? " - " + selectedWeight.label : ""}`,
//       price: basePrice * weightMultiplier,
//       image: mainImg,
//       qty,
//     });
//     alert("Added to cart ✅");
//     onClose();
//   };

//   return (
//     <div
//       className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
//       style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
//     >
//       <div
//         className="bg-white rounded shadow-lg p-4"
//         style={{ maxWidth: "900px", width: "100%", position: "relative" }}
//       >
//         {/* Close Button */}
//         <button
//           className="btn btn-sm btn-danger position-absolute top-0 end-0 m-3"
//           onClick={onClose}
//         >
//           ✖
//         </button>

//         <div className="row g-4">
//           {/* Left: Images */}
//           <div className="col-md-6">
//             <img
//               src={mainImg}
//               alt={product.name}
//               className="img-fluid rounded shadow"
//               style={{ maxHeight: "350px", objectFit: "cover", width: "100%" }}
//             />
//             {product.images && product.images.length > 1 && (
//               <div className="d-flex gap-2 mt-3 overflow-auto">
//                 {product.images.map((img, i) => (
//                   <img
//                     key={i}
//                     src={`http://localhost:5000${img}`}
//                     alt={`thumb-${i}`}
//                     className="img-thumbnail"
//                     style={{ height: "80px", width: "80px", objectFit: "cover", cursor: "pointer" }}
//                     onClick={() => setMainImg(`http://localhost:5000${img}`)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Right: Product Info */}
//           <div className="col-md-6">
//             <h3 className="fw-bold">{product.name}</h3>
//             <p className="text-muted">{product.category}</p>
//             <p>{product.description}</p>

//             {/* Price */}
//             <h4 className="text-warning fw-bold">₹{finalPrice.toFixed(2)}</h4>

//             {/* Weight Selection */}
//             {product.weights && (
//               <div className="mb-3">
//                 <label className="fw-bold">Select Weight:</label>
//                 <select
//                   className="form-select w-50"
//                   value={selectedWeight?.label}
//                   onChange={(e) =>
//                     setSelectedWeight(
//                       product.weights?.find((w) => w.label === e.target.value) || null
//                     )
//                   }
//                 >
//                   {product.weights.map((w, i) => (
//                     <option key={i} value={w.label}>
//                       {w.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {/* Quantity */}
//             <div className="d-flex align-items-center gap-2 mb-3">
//               <button
//                 className="btn btn-outline-secondary"
//                 onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
//               >
//                 -
//               </button>
//               <span className="fw-bold">{qty}</span>
//               <button
//                 className="btn btn-outline-secondary"
//                 onClick={() => setQty(qty + 1)}
//               >
//                 +
//               </button>
//             </div>

//             {/* Buttons */}
//             <div className="d-flex gap-2">
//               <button className="btn btn-warning flex-grow-1" onClick={handleAddToCart}>
//                 Add to Cart
//               </button>
//               <button
//                 className="btn btn-success flex-grow-1"
//                 onClick={() => {
//                   handleAddToCart();
//                   window.location.href = "/orders";
//                 }}
//               >
//                 Buy Now
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductModal;

import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNotificationContext } from "../context/NotificationContext";

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
  image: string; // main image
  images?: string[]; // extra images
  availability: boolean;
}

const ProductModal = ({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) => {
  const { success, error } = useNotificationContext();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);

  const getImageUrl = (image: string | undefined): string => {
    if (!image) return "/images/placeholder.jpg";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  const [mainImg, setMainImg] = useState(getImageUrl(product.image));

  // Hardcode default weights dynamically here
  useEffect(() => {
    const defaultWeights: Weight[] = [
      { label: "250g", multiplier: 1 },
      { label: "500g", multiplier: 1.9 },
      { label: "1kg", multiplier: 3.7 },
    ];
    setWeights(defaultWeights);
    setSelectedWeight(defaultWeights[0]);
  }, [product]);

  const basePrice = product.price;
  const weightMultiplier = selectedWeight ? selectedWeight.multiplier : 1;
  const finalPrice = basePrice * weightMultiplier * qty;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: `${product.name}${
        selectedWeight ? " - " + selectedWeight.label : ""
      }`,
      price: basePrice * weightMultiplier,
      image: mainImg,
      qty,
      variant: selectedWeight?.label, // ✅ Store variant for proper matching
    });
    success("🛒 Added to cart!");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 top-0 left-0 w-full h-full flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full mx-4 relative"
      >
        {/* Close Button */}
        <button
          className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded absolute top-4 right-4"
          onClick={onClose}
        >
          ✖
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div>
            <img
              src={mainImg}
              alt={product.name}
              className="w-full h-80 object-cover rounded-lg shadow"
            />
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={getImageUrl(img)}
                    alt={`thumb-${i}`}
                    className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => setMainImg(getImageUrl(img))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <h3 className="font-bold text-2xl text-gray-800">{product.name}</h3>
            <p className="text-gray-500">{product.category}</p>
            <p className="text-gray-700 mb-3">{product.description}</p>

            {/* Price */}
            <h4 className="text-yellow-600 font-bold text-2xl mb-4">₹{finalPrice.toFixed(2)}</h4>

            {/* Weight Selection */}
            {weights.length > 0 && (
              <div className="mb-4">
                <label className="font-bold block mb-2">Select Weight:</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 w-1/2"
                  value={selectedWeight?.label}
                  onChange={(e) =>
                    setSelectedWeight(
                      weights.find((w) => w.label === e.target.value) || null
                    )
                  }
                >
                  {weights.map((w, i) => (
                    <option key={i} value={w.label}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-2 mb-4">
              <button
                className="px-3 py-2 border border-gray-400 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
              >
                −
              </button>
              <span className="font-bold text-lg">{qty}</span>
              <button
                className="px-3 py-2 border border-gray-400 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setQty(qty + 1)}
              >
                +
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded transition-colors"
                onClick={handleAddToCart}
              >
                🛒 Add to Cart
              </button>
              <button
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors"
                onClick={() => {
                  handleAddToCart();
                  window.location.href = "/orders";
                }}
              >
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
