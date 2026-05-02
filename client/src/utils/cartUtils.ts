// src/utils/cartUtils.ts
import { safeJsonParse } from "./safeJson";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  qty: number;
}

export const getCart = (): CartItem[] => {
  const saved = localStorage.getItem("cart");
  return safeJsonParse<CartItem[]>(saved, []);
};

export const saveCart = (cart: CartItem[]) => {
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
};

export const clearCart = () => {
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("cartUpdated"));
};

export const addToCart = (item: CartItem) => {
  const cart = getCart();
  const existing = cart.find((p) => p.id === item.id);

  if (existing) {
    existing.qty += item.qty; // qty बढ़ाओ
  } else {
    cart.push(item);
  }

  saveCart(cart);
};

export const removeFromCart = (id: number) => {
  const cart = getCart().filter((p) => p.id !== id);
  saveCart(cart);
};
