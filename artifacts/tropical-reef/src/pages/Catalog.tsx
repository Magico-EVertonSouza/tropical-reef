import { useEffect, useState, useCallback } from "react";
import { getCorals } from "@/lib/firestore";
import { seedCoralsIfEmpty } from "@/lib/seed";
import type { Coral, CoralCategory } from "@/types/coral";
import { CoralCard } from "@/components/CoralCard";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "react-icons/si";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

const CATEGORIES: ("All" | CoralCategory)[] = [
  "All",
  "Zoanthus",
  "SPS",
  "LPS",
  "Softcoral",
  "Acropora",
  "Other",
];

export default function Catalog() {
  const [corals, setCorals] = useState<Coral[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"All" | CoralCategory>("All");

  const { selectedCorals, orderViaWhatsApp } = useCart();
  const { userProfile } = useAuth();

  const fetchCorals = useCallback(async (category: "All" | CoralCategory) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCorals(category === "All" ? undefined : { category });
      setCorals(data);

      // Auto-seed only on the "All" tab when collection is empty.
      // By this point the Firestore connection is already warm, so the
      // batch write will resolve quickly.
      if (data.length === 0 && category === "All") {
        setSeeding(true);
        try {
          const { seeded } = await seedCoralsIfEmpty();
          if (seeded) {
            const fresh = await getCorals();
            setCorals(fresh);
          }
        } catch (seedErr: any) {
          // Non-fatal: show seed error as a banner but don't block catalog
          console.warn("[Catalog] Seed falhou:", seedErr?.message);
          setError(seedErr?.message ?? "Erro ao inserir dados de demonstração.");
        } finally {
          setSeeding(false);
        }
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error("[Catalog] ❌ Erro:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorals(activeCategory);
  }, [activeCategory, fetchCorals]);

  const isWorking = loading || seeding;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Tropical Reef Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto mt-12">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            Tropical Reef
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium tracking-wide">
            Galeria exclusiva de corais premium para aquaristas exigentes.
          </p>
        </div>
      </section>

      <main className="container flex-1 py-8 px-4 md:px-8 max-w-7xl mx-auto mb-24">
        {/* Filter Bar */}
        <div className="mb-8 sticky top-20 z-30 bg-background/90 backdrop-blur py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 p-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                      : "bg-card text-muted-foreground border border-border/50 hover:border-primary/50 hover:text-white"
                  }`}
                >
                  {category === "All" ? "Todos" : category}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* Seeding banner */}
        {seeding && (
          <div className="mb-6 flex gap-2 items-center rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary/80">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-primary/50 border-t-primary animate-spin" />
            Carregando catálogo de demonstração...
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex gap-2 items-start rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Erro ao carregar corais</p>
              <p className="text-xs opacity-80">{error}</p>
              {error.includes("Permissão") && (
                <p className="text-xs mt-2 opacity-80">
                  Firebase Console → Firestore → Rules → altere para:{" "}
                  <code className="bg-black/30 px-1 rounded">allow read, write: if true;</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {isWorking && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card border border-border/30">
                <Skeleton className="aspect-square w-full bg-muted/40" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3 bg-muted/40" />
                  <Skeleton className="h-3 w-1/3 bg-muted/40" />
                  <Skeleton className="h-8 w-full bg-muted/40 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coral grid */}
        {!isWorking && corals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {corals.map((coral) => (
              <CoralCard key={coral.id} coral={coral} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isWorking && corals.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Nenhum coral disponível no momento.</p>
            <p className="text-muted-foreground/60 text-sm mt-2">
              Acesse o painel administrativo para adicionar corais ao catálogo.
            </p>
          </div>
        )}
      </main>

      {/* Floating Cart */}
      {selectedCorals.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-md mx-auto bg-card border border-primary/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl supports-[backdrop-filter]:bg-card/80">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground font-medium">Selecionados</span>
              <span className="text-lg font-bold text-white">
                {selectedCorals.length} cora{selectedCorals.length === 1 ? "l" : "is"}
              </span>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 px-6 shadow-lg shadow-emerald-900/20"
              onClick={() => orderViaWhatsApp(userProfile?.name)}
            >
              <SiWhatsapp className="w-5 h-5" />
              Pedir via WhatsApp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
