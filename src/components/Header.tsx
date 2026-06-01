import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/loja", label: "Loja" },
  { to: "/categorias", label: "Categorias" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const searchParams = (routerState.location.search as any) || {};
  
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(!!searchParams.search);
  const [searchValue, setSearchValue] = useState(searchParams.search || "");
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.search) {
      setSearchValue(searchParams.search);
      setSearchOpen(true);
    }
  }, [searchParams.search]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(!!profile?.is_admin);
      } else {
        setIsAdmin(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(!!profile?.is_admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate({
        to: "/loja",
        search: { search: searchValue.trim() },
      });
      setSearchOpen(false);
      setSearchValue("");
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-18 items-center justify-between py-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm font-medium tracking-wide transition-colors relative group ${pathname === n.to ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
                <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all ${pathname === n.to ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ))}
            {session ? (
              <Link
                to="/auth/perfil"
                className={`text-sm font-medium tracking-wide transition-colors relative group ${pathname === "/auth/perfil" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Perfil
                <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all ${pathname === "/auth/perfil" ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className={`text-sm font-medium tracking-wide transition-colors relative group ${pathname === "/auth/login" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Entrar
                <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all ${pathname === "/auth/login" ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            )}
            <Link
              to="/admin"
              className={`text-sm font-medium tracking-wide transition-colors relative group ${pathname === "/admin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Admin
              <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all ${pathname === "/admin" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Buscar"
              className="h-10 w-10 grid place-items-center rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Carrinho"
              className="h-10 w-10 grid place-items-center rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center glow-purple">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobile((m) => !m)}
              aria-label="Menu"
              className="lg:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary transition-colors text-foreground"
            >
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                autoFocus
                aria-label="Buscar produtos"
                placeholder="Buscar produtos, miniaturas, cosplay..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-11 bg-input border border-border rounded-md pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </form>
          </div>
        )}

        {mobile && (
          <nav className="lg:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobile(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium ${pathname === n.to ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
              >
                {n.label}
              </Link>
            ))}
            {session ? (
              <Link
                to="/auth/perfil"
                onClick={() => setMobile(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium ${pathname === "/auth/perfil" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
              >
                Perfil
              </Link>
            ) : (
              <Link
                to="/auth/login"
                onClick={() => setMobile(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium ${pathname === "/auth/login" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
              >
                Entrar
              </Link>
            )}
            <Link
              to="/admin"
              onClick={() => setMobile(false)}
              className={`px-4 py-3 rounded-md text-sm font-medium ${pathname === "/admin" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
            >
              Admin
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}