import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartProduct {
  id: number;
  productId?: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variant?: string; // e.g., "250g", "500g", "1kg"
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number, variant?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartProduct[]>(() => {
    // Load cart from localStorage on mount - scoped to current user
    const userId = localStorage.getItem("userId"); // User ID from login
    if (!userId) return [];
    
    const savedCart = localStorage.getItem(`pedhewala_cart_${userId}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes - scoped to current user
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.setItem(`pedhewala_cart_${userId}`, JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: CartProduct) => {
    setCart((prevCart) => {
      // Match by both id AND variant (weight) to handle different sizes
      const existingItem = prevCart.find(
        (item) => item.id === product.id && item.variant === product.variant
      );

      if (existingItem) {
        // If exact same product + variant already in cart, increase quantity
        return prevCart.map((item) =>
          item.id === product.id && item.variant === product.variant
            ? { ...item, qty: item.qty + product.qty }
            : item
        );
      }

      // Add new product or new variant to cart
      return [...prevCart, product];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, qty: number, variant?: string) => {
    if (qty <= 0) {
      // Remove with variant matching
      setCart((prevCart) =>
        prevCart.filter((item) => !(item.id === id && item.variant === variant))
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.variant === variant ? { ...item, qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
