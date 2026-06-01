import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Camera, Save, LogOut, Loader2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/auth/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [userActualEmail, setUserActualEmail] = useState("");
  const [isSendingEmailLink, setIsSendingEmailLink] = useState(false);
  const [isSendingPasswordLink, setIsSendingPasswordLink] = useState(false);
  
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      setUserActualEmail(user.email || "");

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

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  const handleRequestEmailChange = async () => {
    try {
      setIsSendingEmailLink(true);
      const { error } = await supabase.auth.updateUser({ email: userActualEmail });
      // Note: Supabase can send an email change link to the current email
      // but to actually CHANGE the email to a NEW one, we usually pass the new email.
      // The user asked for "the same thing you did for password" which is a request button.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(userActualEmail, {
        redirectTo: `${window.location.origin}/auth/perfil?type=email_change`,
      });
      
      if (resetError) throw resetError;
      toast.success("E-mail para alteração de e-mail enviado!");
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message);
    } finally {
      setIsSendingEmailLink(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    try {
      setIsSendingPasswordLink(true);
      const { error } = await supabase.auth.resetPasswordForEmail(userActualEmail, {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });
      if (error) throw error;
      toast.success("E-mail de redefinição de senha enviado!");
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message);
    } finally {
      setIsSendingPasswordLink(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
    toast.success("Até logo!");
  };

  const removeAvatar = () => {
    setProfile({ ...profile, avatar_url: "" });
    toast.info("Foto de perfil marcada para remoção. Clique em Salvar para confirmar.");
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você deve selecionar uma imagem para o upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não encontrado.");

      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Imagem carregada! Não esqueça de salvar as alterações.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-card/40 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl space-y-8 animate-scale-in">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div 
              className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative overflow-hidden group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`Avatar de ${profile.full_name || profile.username || "usuário"}`} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                ref={fileInputRef}
                className="hidden"
              />
            </div>
            {profile.avatar_url && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={removeAvatar}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive h-7 px-2"
              >
                Remover Foto
              </Button>
            )}
          </div>
          <div className="flex-1 flex justify-between items-start w-full">
            <div>
              <h1 className="text-2xl font-black">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas informações</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sair da conta" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors mt-1">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="@usuario"
                  className="pl-10 bg-background/50 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Seu nome"
                  className="pl-10 bg-background/50 h-11"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label htmlFor="email">Alterar Email de Login</Label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="novo@email.com"
                    className="pl-10 bg-background/50 h-11"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleRequestEmailChange}
                  disabled={isSendingEmailLink}
                  className="h-11 px-6 font-bold uppercase tracking-wider text-xs whitespace-nowrap"
                >
                  {isSendingEmailLink ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar Troca de Email"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-1">
                ATUAL: {userActualEmail}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label>Segurança da Conta</Label>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleRequestPasswordReset}
                disabled={isSendingPasswordLink}
                className="w-full h-11 font-bold uppercase tracking-wider text-xs border-primary/20 hover:bg-primary/10"
              >
                {isSendingPasswordLink ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Solicitar Redefinição de Senha por E-mail
              </Button>
              <p className="text-[10px] text-muted-foreground text-center uppercase font-bold tracking-widest">
                Enviaremos um link seguro para o seu e-mail cadastrado
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-bold glow-purple uppercase tracking-widest" disabled={updating}>
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