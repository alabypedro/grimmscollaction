import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Check, X, Sparkles, UserPlus } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Acesse sua Conta — Grimm's Collection" },
      { name: "description", content: "Entre na sua conta Grimm's Collection para acompanhar pedidos, salvar favoritos e acessar drops exclusivos de impressão 3D." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Acesse sua Conta — Grimm's Collection" },
      { property: "og:description", content: "Login da Grimm's Collection: acompanhe pedidos e drops exclusivos de impressão 3D." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/auth/login" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/auth/login" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 8 && password.length <= 70,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const signUpValid = name.trim().length > 0 && emailValid && passwordValid && passwordsMatch;
  const signInValid = emailValid && password.length > 0;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/recovery`,
        });
        if (error) throw error;
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.");
        setIsForgot(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: name
            },
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.");
        setSuccess(true);
        setTimeout(() => {
          setIsSignUp(false);
          setSuccess(false);
        }, 2000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        window.location.href = "/";
      }
    } catch (err: any) {
      if (err.message === "User already registered" || err.code === "user_already_exists") {
        toast.error("Já existe uma conta com este e-mail. Tente fazer login.");
        setIsSignUp(false);
      } else {
        toast.error(err.message || "Erro na autenticação.");
      }
    } finally {
      if (!success) setLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-hero p-4 page-transition overflow-hidden">
        <h1 className="sr-only">Recuperar senha — Grimm's Collection</h1>
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

        <Card className="w-full max-w-md glass-strong shadow-elegant border-border relative z-10">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <Logo className="scale-125" />
            </div>
            <CardTitle className="text-2xl font-black">Recuperar Senha</CardTitle>
            <CardDescription>
              Enviaremos um link de recuperação para seu e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 glow-purple font-bold" disabled={loading || !emailValid}>
                {loading ? "ENVIANDO..." : "ENVIAR LINK"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgot(false)}>
                VOLTAR AO LOGIN
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-hero p-4 page-transition overflow-hidden">
      <h1 className="sr-only">{isSignUp ? "Criar conta na Grimm's Collection" : "Entrar na Grimm's Collection"}</h1>
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />

      <Card className="w-full max-w-md glass-strong shadow-elegant border-border relative z-10 animate-scale-in">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <Logo className="scale-125 animate-float" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 text-[10px] tracking-widest text-primary mx-auto mb-2 uppercase font-bold">
            {isSignUp ? <UserPlus className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />} 
            {isSignUp ? "NOVO COLECIONADOR" : "ACESSO PREMIUM"}
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">
            {isSignUp ? "Criar Conta" : "Entrar"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Junte-se à Grimm's Collection" : "Acesse sua Grimm's Collection"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    className="pl-10 h-11"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}



            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${emailValid ? "text-primary" : "text-muted-foreground"}`} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className={`pl-10 h-11 ${emailValid ? "border-primary/50" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-xs text-primary font-bold hover:underline"
                    onClick={() => setIsForgot(true)}
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <ul className="mt-3 space-y-1.5 text-[10px] uppercase font-bold tracking-wider">
                  {[
                    { ok: passwordChecks.length, label: "8 a 70 caracteres" },
                    { ok: passwordChecks.lower, label: "Letra minúscula" },
                    { ok: passwordChecks.upper, label: "Letra maiúscula" },
                    { ok: passwordChecks.number, label: "Número" },
                    { ok: passwordChecks.symbol, label: "Símbolo (Ex: !@#$%)" },
                  ].map((r) => (
                    <li key={r.label} className="flex items-center gap-2">
                      {r.ok ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30" />
                      )}
                      <span className={r.ok ? "text-foreground" : "text-muted-foreground/50"}>
                        {r.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${confirmPassword && !passwordsMatch ? "text-destructive" : "text-muted-foreground"}`} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 h-11 ${confirmPassword && !passwordsMatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-fade-in">
                    As senhas não coincidem
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-bold glow-purple mt-2 text-sm uppercase tracking-widest"
              disabled={loading || success || (isSignUp ? !signUpValid : !signInValid)}
            >
              {success
                ? "CONTA CRIADA!"
                : loading
                ? "CARREGANDO..."
                : isSignUp
                ? "CADASTRAR"
                : "ENTRAR"}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-bold">Ou continuar com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-bold flex items-center justify-center gap-2"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/`,
                },
              });
              if (error) toast.error(error.message);
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2 font-medium">
            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button
              type="button"
              className="text-primary font-black hover:underline uppercase tracking-tight"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Entrar" : "Cadastre-se"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}