import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getCorals, deleteCoral } from "@/lib/firestore";
import { seedCoralsIfEmpty } from "@/lib/seed";
import type { Coral } from "@/types/coral";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoralDialog } from "@/components/CoralDialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, LayoutDashboard, DatabaseZap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [corals, setCorals] = useState<Coral[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCoral, setSelectedCoral] = useState<Coral | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coralToDelete, setCoralToDelete] = useState<Coral | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || !isAdmin) {
        setLocation("/login");
      }
    }
  }, [currentUser, isAdmin, authLoading, setLocation]);

  const fetchCorals = async () => {
    setLoading(true);
    try {
      const data = await getCorals();
      setCorals(data);
    } catch (error) {
      console.error("Failed to fetch corals:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os corais.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCorals();
    }
  }, [isAdmin]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  const handleEdit = (coral: Coral) => {
    setSelectedCoral(coral);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCoral(null);
    setDialogOpen(true);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { seeded, count } = await seedCoralsIfEmpty();
      if (seeded) {
        toast({ title: "Seed concluído", description: `${count} corais inseridos com sucesso.` });
        fetchCorals();
      } else {
        toast({ title: "Sem alterações", description: `Todos os ${count} corais já existiam.` });
      }
    } catch (err: any) {
      toast({ title: "Erro no seed", description: err?.message ?? "Falha ao inserir corais de demonstração.", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = (coral: Coral) => {
    setCoralToDelete(coral);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!coralToDelete) return;
    try {
      await deleteCoral(coralToDelete.id, coralToDelete.imageUrl);
      toast({ title: "Sucesso", description: "Coral excluído." });
      fetchCorals();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o coral.", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCoralToDelete(null);
    }
  };

  const stats = {
    total: corals.length,
    available: corals.filter(c => c.status === "available").length,
    sold: corals.filter(c => c.status === "sold").length,
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo de corais.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seeding}
            className="gap-2 border-border/50 text-muted-foreground hover:text-white hover:border-primary/50"
          >
            <DatabaseZap className="w-4 h-4" />
            {seeding ? "Inserindo..." : "Seed Demo"}
          </Button>
          <Button onClick={handleCreate} className="gap-2" data-testid="btn-create-coral">
            <Plus className="w-4 h-4" />
            Novo Coral
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Corais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-md border-t-4 border-t-emerald-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400/70">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-400">{stats.available}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-md border-t-4 border-t-rose-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-rose-400/70">Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-rose-400">{stats.sold}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-12 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : corals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum coral cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                corals.map((coral) => (
                  <TableRow key={coral.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">{coral.code}</TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border border-border/50">
                        {coral.imageUrl ? (
                          <img src={coral.imageUrl} alt={coral.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">S/ img</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-white">{coral.name}</TableCell>
                    <TableCell className="text-muted-foreground">{coral.category}</TableCell>
                    <TableCell className="font-semibold text-primary">R$ {coral.price.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${coral.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                          ${coral.status === 'reserved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                          ${coral.status === 'sold' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                        `}
                      >
                        {coral.status === 'available' ? 'Disponível' : coral.status === 'reserved' ? 'Reservado' : 'Vendido'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(coral)}
                          data-testid={`btn-edit-${coral.id}`}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => confirmDelete(coral)}
                          data-testid={`btn-delete-${coral.id}`}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CoralDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        coral={selectedCoral} 
        onSuccess={fetchCorals} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir coral?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o coral <span className="font-bold text-white">{coralToDelete?.name}</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border/50 text-white hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}