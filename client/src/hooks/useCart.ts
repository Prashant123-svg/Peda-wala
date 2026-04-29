import { useCart } from "../context/CartContext";

export const useCartHook = () => {
  return useCart();
};
