import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Camera, Save, LogOut } from "lucide-react";

export const Route = createFileRoute("/auth/perfil")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: PerfilPage,
});

function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, full_name, avatar_url`)
        .eq("id", user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Sem usuário logado");

      const updates = {
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
    toast.success("Até logo!");
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas informações</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="@usuario"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Seu nome"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">URL do Avatar</Label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="avatar"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://..."
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-bold glow-purple" disabled={updating}>
            {updating ? "SALVANDO..." : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" /> SALVAR ALTERAÇÕES
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
