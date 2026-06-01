import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth/recovery")({
  component: RecoveryPage,
});

function RecoveryPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (the recovery link should have logged us in temporarily)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Link de recuperação inválido ou expirado.");
        navigate({ to: "/auth/login" });
      }
    });
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    const passwordChecks = {
      length: password.length >= 8 && password.length <= 70,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };

    if (!Object.values(passwordChecks).every(Boolean)) {
      toast.error("A senha deve ter entre 8 e 70 caracteres e conter letras maiúsculas, minúsculas, números e símbolos.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success("Senha atualizada com sucesso!");
      
      setTimeout(() => {
        navigate({ to: "/auth/login" });
      }, 3000);
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl max-w-md w-full text-center space-y-4 animate-scale-in">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
          </div>
          <h1 className="text-2xl font-black">Senha Redefinida!</h1>
          <p className="text-muted-foreground">Sua senha foi atualizada com sucesso. Redirecionando para o login...</p>
          <Button onClick={() => navigate({ to: "/auth/login" })} className="w-full h-12 font-bold glow-purple uppercase tracking-widest">
            IR PARA LOGIN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl max-w-md w-full space-y-8 animate-scale-in">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-2">NOVA SENHA</h1>
          <p className="text-sm text-muted-foreground">Crie uma senha forte para sua conta Grimm's Collection</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-background/50 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-background/50 h-11"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-bold glow-purple uppercase tracking-widest" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "REDEFINIR SENHA"}
          </Button>
        </form>
      </div>
    </div>
  );
}
