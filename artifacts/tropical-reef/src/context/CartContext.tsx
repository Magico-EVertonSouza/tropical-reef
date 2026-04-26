import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Coral } from "@/types/coral";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* =========================
   TIPOS DO CARRINHO
========================= */
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
  addToCart: (coral: Coral) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (coralId: string) => Promise<void>;
  updateQuantity: (coralId: string, quantity: number) => void;
  isInCart: (coralId: string) => boolean;
  clearCart: () => Promise<void>;
  orderViaWhatsApp: (customerName?: string) => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "5500000000000";

/* =========================
   STORAGE POR USUÁRIO
========================= */
function getCartKey(userId?: string) {
  return userId
    ? `tropical_reef_cart_${userId}`
    : "tropical_reef_cart_guest";
}

function loadCart(userId?: string): CartItem[] {
  try {
    const raw = localStorage.getItem(getCartKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* =========================
   PROVIDER
========================= */
export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  /* =========================
     CARREGA CARRINHO
  ========================= */
  useEffect(() => {
    if (!userId) return;
    setCartItems(loadCart(userId));
  }, [userId]);

  /* =========================
     SALVA CARRINHO
  ========================= */
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(
      getCartKey(userId),
      JSON.stringify(cartItems)
    );
  }, [cartItems, userId]);

  /* =========================
     LIMPA AO LOGOUT
  ========================= */
  useEffect(() => {
    if (!userId) setCartItems([]);
  }, [userId]);

  /* =====================================================
     🔥 ADD TO CART (COM TRANSACTION - SEGURANÇA REAL)
  ===================================================== */
  const addToCart = useCallback(
    async (coral: Coral) => {
      if (!userId) {
        return {
          success: false,
          message: "Precisa estar logado",
        };
      }

      const coralRef = doc(db, "corals", coral.id);

      try {
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(coralRef);

          if (!snap.exists()) {
            throw new Error("Coral não encontrado");
          }

          const data = snap.data();

          // ❌ já reservado ou vendido
          if (data.status !== "available") {
            throw new Error("Este coral já foi reservado");
          }

          // 🔥 RESERVA SEGURA
          transaction.update(coralRef, {
            status: "reserved",
            reservedBy: userId,
            reservedAt: new Date(),
          });
        });

        // 🛒 adiciona no carrinho local
        setCartItems((prev) => {
          const existing = prev.find((i) => i.id === coral.id);

          if (existing) {
            return prev.map((i) =>
              i.id === coral.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
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
              maxStock: coral.stock ?? 1,
            },
          ];
        });

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    [userId]
  );

  /* =====================================================
     ❌ REMOVE ITEM (LIBERA RESERVA)
  ===================================================== */
  const removeFromCart = useCallback(async (coralId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== coralId)
    );

    await updateDoc(doc(db, "corals", coralId), {
      status: "available",
      reservedBy: null,
      reservedAt: null,
    });
  }, []);

  /* =========================
     UPDATE QUANTITY
  ========================= */
  const updateQuantity = useCallback(
    (coralId: string, quantity: number) => {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === coralId
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.min(quantity, item.maxStock)
                ),
              }
            : item
        )
      );
    },
    []
  );

  /* =========================
     CHECK IN CART
  ========================= */
  const isInCart = useCallback(
    (coralId: string) =>
      cartItems.some((i) => i.id === coralId),
    [cartItems]
  );

  /* =====================================================
     🧹 CLEAR CART (LIBERA TUDO NO FIRESTORE)
  ===================================================== */
  const clearCart = useCallback(async () => {
    for (const item of cartItems) {
      await updateDoc(doc(db, "corals", item.id), {
        status: "available",
        reservedBy: null,
        reservedAt: null,
      });
    }

    setCartItems([]);

    if (userId) {
      localStorage.removeItem(getCartKey(userId));
    }
  }, [cartItems, userId]);

  /* =========================
     TOTAL
  ========================= */
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  /* =========================
     WHATSAPP ORDER
  ========================= */
  const orderViaWhatsApp = useCallback(
    (customerName?: string) => {
      if (cartItems.length === 0) return;

      const list = cartItems
        .map(
          (i) =>
            `🪸 ${i.name} (${i.code}) — Qtd: ${i.quantity} — R$ ${(i.price * i.quantity)
              .toFixed(2)
              .replace(".", ",")}`
        )
        .join("\n");

      const total = `R$ ${cartTotal
        .toFixed(2)
        .replace(".", ",")}`;

      const msg =
        `Olá 👋 ${
          customerName ? `me chamo *${customerName}*` : ""
        }\n\n` +
        `Quero esses corais:\n\n${list}\n\n💰 Total: ${total}`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          msg
        )}`,
        "_blank"
      );
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
        clearCart,
        orderViaWhatsApp,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================
   HOOK
========================= */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx)
    throw new Error("useCart must be used within CartProvider");
  return ctx;
}