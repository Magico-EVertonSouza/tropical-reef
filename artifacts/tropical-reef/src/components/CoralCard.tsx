import { useState } from "react";
import type { Coral } from "@/types/coral";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";

interface CoralCardProps {
  coral: Coral;
}

export function CoralCard({ coral }: CoralCardProps) {
  const { addToCart, removeFromCart, updateQuantity, isInCart, getCartItem } = useCart();
  const [blocked, setBlocked] = useState(false);

  const inCart = isInCart(coral.id);
  const cartItem = getCartItem(coral.id);
  const stock = coral.stock ?? 1;
  const outOfStock = stock === 0;
  const isAvailable = coral.status === "available" && !outOfStock;

  const statusColors = {
    available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    reserved: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    sold: "bg-rose-500/20 text-rose-400 border-rose-500/50",
  };

  const statusLabels = {
    available: outOfStock ? "Esgotado" : "Disponível",
    reserved: "Reservado",
    sold: "Vendido",
  };

  const statusColor = outOfStock
    ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
    : statusColors[coral.status];

  const handleAddToCart = () => {
    const result = addToCart(coral);
    if (!result.success) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 2000);
    }
  };

  const handleIncrease = () => {
    if (!cartItem) return;
    const result = addToCart(coral);
    if (!result.success) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 2000);
    }
  };

  const handleDecrease = () => {
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      removeFromCart(coral.id);
    } else {
      updateQuantity(coral.id, cartItem.quantity - 1);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden bg-card border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 flex flex-col",
        inCart ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50",
        !isAvailable && "opacity-80 grayscale-[0.3]"
      )}
    >
      {/* Image */}
      <div className="relative">
        <div className="w-full h-48 bg-muted overflow-hidden">
          {coral.imageUrl ? (
            <img
              src={coral.imageUrl}
              alt={coral.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Sem imagem
            </div>
          )}
        </div>

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 p-3 w-full z-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-xs font-mono text-primary/80 mb-0.5">{coral.code}</p>
              <h3 className="font-serif text-lg font-bold text-white leading-tight line-clamp-1">
                {coral.name}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn("whitespace-nowrap px-2 py-0.5 border text-xs font-medium shrink-0", statusColor)}
            >
              {statusLabels[coral.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Card body */}
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{coral.size} • {coral.category}</p>
          <p className="text-lg font-semibold text-primary">
            R$ {coral.price.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Stock info */}
        <p className={cn("text-xs font-medium", outOfStock ? "text-rose-400" : "text-muted-foreground")}>
          {outOfStock ? "Esgotado" : `Disponível: ${stock} unidade${stock !== 1 ? "s" : ""}`}
        </p>

        {/* Unavailability message */}
        {blocked && (
          <p className="text-xs text-amber-400 font-medium animate-in fade-in">
            Quantidade indisponível
          </p>
        )}

        {/* Cart controls */}
        {isAvailable && (
          inCart && cartItem ? (
            <div className="flex items-center justify-between gap-2 mt-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={handleDecrease}
              >
                {cartItem.quantity <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </Button>
              <span className="text-sm font-semibold text-white min-w-[2rem] text-center">
                {cartItem.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
                onClick={handleIncrease}
                disabled={cartItem.quantity >= stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full mt-auto gap-2"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao carrinho
            </Button>
          )
        )}

        {!isAvailable && coral.status !== "available" && (
          <Button size="sm" className="w-full mt-auto" disabled>
            {coral.status === "reserved" ? "Reservado" : "Vendido"}
          </Button>
        )}

        {coral.status === "available" && outOfStock && (
          <Button size="sm" className="w-full mt-auto" disabled>
            Esgotado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
