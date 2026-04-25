import { createContext, useContext, useState } from "react";
import type { Coral } from "@/types/coral";

interface CartContextValue {
  selectedCorals: Coral[];
  addToCart: (coral: Coral) => void;
  removeFromCart: (coralId: string) => void;
  isInCart: (coralId: string) => boolean;
  clearCart: () => void;
  orderViaWhatsApp: (customerName?: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5500000000000";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [selectedCorals, setSelectedCorals] = useState<Coral[]>([]);

  const addToCart = (coral: Coral) => {
    setSelectedCorals((prev) =>
      prev.find((c) => c.id === coral.id) ? prev : [...prev, coral]
    );
  };

  const removeFromCart = (coralId: string) => {
    setSelectedCorals((prev) => prev.filter((c) => c.id !== coralId));
  };

  const isInCart = (coralId: string) => selectedCorals.some((c) => c.id === coralId);

  const clearCart = () => setSelectedCorals([]);

  const orderViaWhatsApp = (customerName?: string) => {
    const coralList = selectedCorals
      .map((c) => `• ${c.name} (${c.code}) — R$ ${c.price.toFixed(2)}`)
      .join("\n");

    const greeting = customerName ? `Olá! Me chamo *${customerName}*.` : "Olá!";
    const message = `${greeting}\n\nGostaria de adquirir os seguintes corais da *Tropical Reef*:\n\n${coralList}\n\nAguardo contato! 🪸`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
  };

  return (
    <CartContext.Provider
      value={{ selectedCorals, addToCart, removeFromCart, isInCart, clearCart, orderViaWhatsApp }}
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
