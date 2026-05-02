import React, { createContext, useContext, useState, useEffect } from "react";
import { useUserContext } from "./UserContext";
import { safeJsonParse } from "../utils/safeJson";

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
const GUEST_CART_KEY = "pedhewala_cart_guest";

const getCartStorageKey = (userId?: string | null) =>
  userId ? `pedhewala_cart_${userId}` : GUEST_CART_KEY;

const loadCart = (storageKey: string) => safeJsonParse<CartProduct[]>(localStorage.getItem(storageKey), []);

const mergeCartItems = (baseCart: CartProduct[], incomingCart: CartProduct[]) => {
  return incomingCart.reduce<CartProduct[]>((mergedCart, incomingItem) => {
    const existingItem = mergedCart.find(
      (item) => item.id === incomingItem.id && item.variant === incomingItem.variant
    );

    if (existingItem) {
      return mergedCart.map((item) =>
        item.id === incomingItem.id && item.variant === incomingItem.variant
          ? { ...item, qty: item.qty + incomingItem.qty }
          : item
      );
    }

    return [...mergedCart, incomingItem];
  }, [...baseCart]);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUserContext();
  const storageKey = getCartStorageKey(user?.id || localStorage.getItem("userId"));

  const [cart, setCart] = useState<CartProduct[]>(() => loadCart(storageKey));

  // Keep cart synced with the active user and preserve guest cart items on login.
  useEffect(() => {
    const currentKey = getCartStorageKey(user?.id || localStorage.getItem("userId"));
    const nextCart = loadCart(currentKey);
    const guestCart = currentKey === GUEST_CART_KEY ? [] : loadCart(GUEST_CART_KEY);
    const mergedCart = currentKey === GUEST_CART_KEY ? nextCart : mergeCartItems(nextCart, guestCart);

    setCart(mergedCart);

    if (currentKey !== GUEST_CART_KEY) {
      localStorage.setItem(currentKey, JSON.stringify(mergedCart));
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [storageKey, user?.id]);

  // Save cart to localStorage whenever it changes - scoped to current user
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

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
