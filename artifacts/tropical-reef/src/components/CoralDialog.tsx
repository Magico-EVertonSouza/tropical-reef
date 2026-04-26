import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createCoral, updateCoral } from "@/lib/firestore";
import type { Coral, CoralFormData, CoralCategory } from "@/types/coral";
import { Loader2 } from "lucide-react";

/* =========================
   CLOUDINARY UPLOAD
========================= */
async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "tropicalreef");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dwy7cw3rq/image/upload",
    { method: "POST", body: formData }
  );

  const data = await res.json();
  console.log("CLOUDINARY RESPONSE:", data);

  if (!data.secure_url) {
    throw new Error("Falha no upload da imagem");
  }

  return data.secure_url;
}

/* ========================= */

const CATEGORIES: CoralCategory[] = [
  "Zoanthus",
  "SPS",
  "LPS",
  "Softcoral",
  "Acropora",
  "Other",
];

const coralSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().min(0.01),
  category: z.enum(["Zoanthus", "SPS", "LPS", "Softcoral", "Acropora", "Other"]),
  size: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["available", "reserved", "sold"]),
  stock: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof coralSchema>;

interface CoralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coral?: Coral | null;
  onSuccess: () => void;
}

export function CoralDialog({
  open,
  onOpenChange,
  coral,
  onSuccess,
}: CoralDialogProps) {
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
      stock: 1,
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
        stock: coral.stock ?? 1,
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
        stock: 1,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [coral, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      let imageUrl = coral?.imageUrl || "";

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error("Imagem obrigatória não enviada.");
      }

      console.log("[CoralDialog] Saving — status:", values.status, "stock:", values.stock);

      const data: CoralFormData = {
        ...values,
        description: values.description || "",
        stock: values.stock,
        imageUrl,
      };

      if (coral) {
        await updateCoral(coral.id, data);
        toast({ title: "Sucesso", description: "Coral atualizado com sucesso." });
      } else {
        await createCoral(data);
        toast({ title: "Sucesso", description: "Coral criado com sucesso." });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[CoralDialog] Error:", error);
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
      <DialogContent className="max-w-md sm:max-w-[600px] bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">
            {coral ? "Editar Coral" : "Novo Coral"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* IMAGE */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-40 h-40 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-sm">Sem imagem</span>
                )}
              </div>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PRICE + STOCK */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CATEGORY */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STATUS */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      console.log("[CoralDialog] Status changed to:", val);
                      field.onChange(val);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

            {/* SIZE */}
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Coral
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
