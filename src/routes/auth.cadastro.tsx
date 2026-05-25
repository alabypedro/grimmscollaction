import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth/cadastro")({
  component: CadastroPage,
});

function CadastroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message);
    } else {
      toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
      navigate({ to: "/auth/login" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 text-xs tracking-widest text-primary mb-4">
            <UserPlus className="h-3 w-3" /> NOVO COLECONADOR
          </div>
          <h1 className="text-3xl font-black tracking-tight">Criar Conta</h1>
          <p className="text-muted-foreground mt-2">Junte-se à Grimm's Collection</p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha forte"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-bold glow-purple" disabled={loading}>
            {loading ? "Criando..." : "CADASTRAR"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/auth/login" className="text-primary font-bold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
