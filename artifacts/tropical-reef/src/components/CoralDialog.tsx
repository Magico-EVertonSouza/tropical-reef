import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createCoral, updateCoral } from "@/lib/firestore";
import type { Coral, CoralFormData, CoralCategory, CoralStatus } from "@/types/coral";
import { Loader2 } from "lucide-react";

const CATEGORIES: CoralCategory[] = ["Zoanthus", "SPS", "LPS", "Softcoral", "Acropora", "Other"];
const STATUSES: CoralStatus[] = ["available", "reserved", "sold"];

const coralSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que 0"),
  category: z.enum(["Zoanthus", "SPS", "LPS", "Softcoral", "Acropora", "Other"]),
  size: z.string().min(1, "Tamanho é obrigatório"),
  description: z.string().optional(),
  status: z.enum(["available", "reserved", "sold"]),
});

type FormValues = z.infer<typeof coralSchema>;

interface CoralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coral?: Coral | null;
  onSuccess: () => void;
}

export function CoralDialog({ open, onOpenChange, coral, onSuccess }: CoralDialogProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(coralSchema),
    defaultValues: {
      name: "",
      price: 0,
      category: "Other",
      size: "",
      description: "",
      status: "available",
    },
  });

  useEffect(() => {
    if (coral && open) {
      form.reset({
        name: coral.name,
        price: coral.price,
        category: coral.category,
        size: coral.size,
        description: coral.description || "",
        status: coral.status,
      });
      setImagePreview(coral.imageUrl || null);
      setImageFile(null);
    } else if (open) {
      form.reset({
        name: "",
        price: 0,
        category: "Other",
        size: "",
        description: "",
        status: "available",
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [coral, open, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: CoralFormData = {
        ...values,
        description: values.description || "",
        imageFile,
      };

      if (coral) {
        await updateCoral(coral.id, data);
        toast({
          title: "Sucesso",
          description: "Coral atualizado com sucesso.",
        });
      } else {
        if (!imageFile) {
          toast({
            title: "Erro",
            description: "Uma imagem é obrigatória para novos corais.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        await createCoral(data);
        toast({
          title: "Sucesso",
          description: "Coral criado com sucesso.",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar coral.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-[600px] border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-primary">
            {coral ? "Editar Coral" : "Novo Coral"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-dashed border-border/50 bg-muted flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-sm">Sem imagem</span>
                )}
              </div>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="w-full max-w-xs"
                data-testid="input-image"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Zoanthus Radioactive" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="250.00" {...field} data-testid="input-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 5 bocas, 3cm" {...field} data-testid="input-size" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do coral..." className="resize-none" {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="btn-cancel">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="btn-save">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Coral
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}