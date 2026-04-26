import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

function translateFirebaseError(code: string): string {
  const messages: Record<string, string> = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/user-not-found": "Nenhuma conta encontrada com este e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está em uso.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    "auth/network-request-failed": "Erro de rede. Verifique sua conexão.",
    "auth/configuration-not-found":
      "Autenticação por e-mail/senha não está ativada no Firebase. Acesse o Firebase Console → Authentication → Sign-in method → Email/Password e ative.",
    "auth/operation-not-allowed":
      "Autenticação por e-mail/senha não está permitida. Ative no Firebase Console → Authentication → Sign-in method.",
  };
  return messages[code] ?? `Erro desconhecido (${code}). Tente novamente.`;
}

export default function Login() {
  const { login, register, currentUser, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && currentUser) {
      setLocation("/");
    }
  }, [currentUser, authLoading, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await login(values.email, values.password);
      toast({ title: "Sucesso", description: "Login efetuado com sucesso." });
      setLocation("/");
    } catch (error: any) {
      const code = error?.code ?? "";
      const msg = translateFirebaseError(code);
      console.error("[Login] ❌ Erro:", code);
      setAuthError(msg);
      toast({ title: "Erro no login", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await register(values.email, values.password, values.name);
      toast({ title: "Sucesso", description: "Conta criada com sucesso." });
      setLocation("/");
    } catch (error: any) {
      const code = error?.code ?? "";
      const msg = translateFirebaseError(code);
      console.error("[Register] ❌ Erro:", code);
      setAuthError(msg);
      toast({
        title: "Erro no cadastro",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border/50 shadow-2xl shadow-black/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-serif text-3xl text-primary">
            Bem-vindo
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Auth error banner */}
          {authError && (
            <div className="mb-4 flex gap-2 items-start rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(v) => { setActiveTab(v); setAuthError(null); }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            {...field}
                            data-testid="input-login-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            data-testid="input-login-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isSubmitting}
                    data-testid="btn-submit-login"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Entrar
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="João Silva"
                            {...field}
                            data-testid="input-register-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            {...field}
                            data-testid="input-register-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            data-testid="input-register-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isSubmitting}
                    data-testid="btn-submit-register"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Conta
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
