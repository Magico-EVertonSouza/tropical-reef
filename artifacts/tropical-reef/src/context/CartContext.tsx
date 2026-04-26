import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Coral } from "@/types/coral";

export interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (coral: Coral) => { success: boolean; message?: string };
  removeFromCart: (coralId: string) => void;
  updateQuantity: (coralId: string, quantity: number) => void;
  isInCart: (coralId: string) => boolean;
  getCartItem: (coralId: string) => CartItem | undefined;
  clearCart: () => void;
  orderViaWhatsApp: (customerName?: string) => void;
  cartTotal: number;
  cartCount: number;
  selectedCorals: Coral[];
}

const CartContext = createContext<CartContextValue | null>(null);

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5500000000000";
const CART_STORAGE_KEY = "tropical_reef_cart";

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
    }
  }, [cartItems]);

  const addToCart = useCallback((coral: Coral): { success: boolean; message?: string } => {
    const stock = coral.stock ?? 1;

    if (stock === 0) {
      return { success: false, message: "Quantidade indisponível" };
    }

    let result: { success: boolean; message?: string } = { success: true };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === coral.id);
      if (existing) {
        if (existing.quantity >= stock) {
          result = { success: false, message: "Quantidade indisponível" };
          return prev;
        }
        return prev.map((item) =>
          item.id === coral.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: coral.id,
          name: coral.name,
          code: coral.code,
          price: coral.price,
          quantity: 1,
          maxStock: stock,
        },
      ];
    });

    return result;
  }, []);

  const removeFromCart = useCallback((coralId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== coralId));
  }, []);

  const updateQuantity = useCallback((coralId: string, quantity: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== coralId) return item;
          const clamped = Math.max(0, Math.min(quantity, item.maxStock));
          return { ...item, quantity: clamped };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const isInCart = useCallback(
    (coralId: string) => cartItems.some((item) => item.id === coralId),
    [cartItems]
  );

  const getCartItem = useCallback(
    (coralId: string) => cartItems.find((item) => item.id === coralId),
    [cartItems]
  );

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCorals: Coral[] = cartItems.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    price: item.price,
    stock: item.maxStock,
    quantity: item.quantity,
  } as unknown as Coral));

  const orderViaWhatsApp = useCallback(
    (customerName?: string) => {
      if (cartItems.length === 0) return;

      const coralList = cartItems
        .map(
          (item) =>
            `🪸 ${item.name} (${item.code}) — Qtd: ${item.quantity} — R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}`
        )
        .join("\n");

      const total = `R$ ${cartTotal.toFixed(2).replace(".", ",")}`;
      const greeting = customerName
        ? `Olá! 👋 Me chamo *${customerName}*.`
        : "Olá! 👋";

      const message =
        `${greeting}\n\nGostaria de adquirir os seguintes corais:\n\n` +
        `${coralList}\n\n` +
        `💰 Total: ${total}`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
    },
    [cartItems, cartTotal]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        isInCart,
        getCartItem,
        clearCart,
        orderViaWhatsApp,
        cartTotal,
        cartCount,
        selectedCorals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
