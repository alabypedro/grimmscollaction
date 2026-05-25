import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Mail, Lock } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { syncCart } = useCart();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "E-mail inválido";
    }
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Erro ao entrar: " + error.message);
      } else {
        toast.success("Bem-vindo de volta!");
        await syncCart();
        navigate({ to: "/", replace: true });
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 text-xs tracking-widest text-primary mb-4">
            <Sparkles className="h-3 w-3" /> ACESSO PREMIUM
          </div>
          <h1 className="text-3xl font-black tracking-tight">Entrar</h1>
          <p className="text-muted-foreground mt-2">Acesse sua Grimm's Collection</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                required
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/auth/recovery" className="text-xs text-primary hover:underline">Esqueceu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`pl-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                required
              />
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 font-bold glow-purple flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ENTRANDO...
              </>
            ) : (
              "ENTRAR"
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link to="/auth/cadastro" className="text-primary font-bold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
