import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { isFirebaseConfigured } from "@/lib/firebase";

import Catalog from "@/pages/Catalog";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function FirebaseSetupBanner() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-[#d4af37]/30 rounded-xl p-8 text-center space-y-4">
        <div className="text-[#d4af37] text-5xl mb-2">🪸</div>
        <h1 className="text-2xl font-bold text-[#d4af37]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Tropical Reef
        </h1>
        <p className="text-white/70 text-sm leading-relaxed">
          Configure suas credenciais do Firebase para ativar o app. Adicione as seguintes variáveis de ambiente (Secrets) no painel do Replit:
        </p>
        <div className="text-left bg-black/40 rounded-lg p-4 space-y-1">
          {[
            "VITE_FIREBASE_API_KEY",
            "VITE_FIREBASE_AUTH_DOMAIN",
            "VITE_FIREBASE_PROJECT_ID",
            "VITE_FIREBASE_STORAGE_BUCKET",
            "VITE_FIREBASE_MESSAGING_SENDER_ID",
            "VITE_FIREBASE_APP_ID",
          ].map((key) => (
            <div key={key} className="text-xs font-mono text-[#d4af37]/80">{key}</div>
          ))}
        </div>
        <p className="text-white/40 text-xs">
          Encontre essas credenciais no Firebase Console → Project Settings → General → Your Apps.
        </p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Catalog} />
          <Route path="/admin" component={Admin} />
          <Route path="/login" component={Login} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupBanner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
