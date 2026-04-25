import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Anchor, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-bold tracking-tight text-foreground">Tropical Reef</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
            Catálogo
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
              Admin
            </Link>
          )}
          
          <div className="ml-4 flex items-center gap-4">
            {currentUser ? (
              <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="btn-logout" className="gap-2 text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Button asChild variant="default" size="sm" data-testid="btn-login">
                <Link href="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={toggleMenu} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="container md:hidden pb-4 pt-2 flex flex-col gap-4 border-b border-border/40 bg-background">
          <Link href="/" onClick={closeMenu} className={`block text-base font-medium transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
            Catálogo
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={closeMenu} className={`block text-base font-medium transition-colors ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
              Admin
            </Link>
          )}
          <div className="h-px bg-border/40 my-2" />
          {currentUser ? (
            <Button variant="ghost" className="justify-start px-0 text-muted-foreground hover:text-destructive" onClick={() => { logout(); closeMenu(); }} data-testid="btn-logout-mobile">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          ) : (
            <Button asChild variant="default" className="w-full" data-testid="btn-login-mobile" onClick={closeMenu}>
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}