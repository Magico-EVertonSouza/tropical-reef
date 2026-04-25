import { Coral } from "@/types/coral";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CoralCardProps {
  coral: Coral;
}

export function CoralCard({ coral }: CoralCardProps) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const selected = isInCart(coral.id);

  const statusColors = {
    available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    reserved: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    sold: "bg-rose-500/20 text-rose-400 border-rose-500/50",
  };

  const statusLabels = {
    available: "Disponível",
    reserved: "Reservado",
    sold: "Vendido",
  };

  const isAvailable = coral.status === "available";

  const toggleSelection = () => {
    if (!isAvailable) return;
    if (selected) {
      removeFromCart(coral.id);
    } else {
      addToCart(coral);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden bg-card border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20",
        selected ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50",
        !isAvailable && "opacity-80 grayscale-[0.3]"
      )}
    >
      {isAvailable && (
        <div 
          className="absolute top-4 right-4 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox 
            checked={selected} 
            onCheckedChange={toggleSelection}
            className="w-6 h-6 rounded-full border-2 border-white/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            data-testid={`checkbox-coral-${coral.id}`}
          />
        </div>
      )}
      
      <div 
        className="relative aspect-square cursor-pointer"
        onClick={toggleSelection}
        data-testid={`card-coral-${coral.id}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        
        {coral.imageUrl ? (
          <img 
            src={coral.imageUrl} 
            alt={coral.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Sem imagem</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 p-4 w-full z-20 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-xs font-mono text-primary/80 mb-1">{coral.code}</p>
              <h3 className="font-serif text-xl font-bold text-white leading-tight line-clamp-1">{coral.name}</h3>
            </div>
            <Badge variant="outline" className={cn("whitespace-nowrap px-2 py-0.5 border text-xs font-medium", statusColors[coral.status])}>
              {statusLabels[coral.status]}
            </Badge>
          </div>
          
          <div className="flex justify-between items-end mt-1">
            <p className="text-sm text-gray-300 line-clamp-1">{coral.size} • {coral.category}</p>
            <p className="text-lg font-semibold text-primary">
              R$ {coral.price.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}