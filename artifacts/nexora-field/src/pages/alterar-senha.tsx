import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

export default function AlterarSenha() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.currentPassword = "Informe a senha atual.";
    if (!newPassword || newPassword.length < 8) e.newPassword = "A nova senha deve ter pelo menos 8 caracteres.";
    if (newPassword === currentPassword) e.newPassword = "A nova senha deve ser diferente da atual.";
    if (newPassword !== confirmPassword) e.confirmPassword = "As senhas não coincidem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const token = getAuthToken();
      const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Erro", description: data.error || "Não foi possível alterar a senha.", variant: "destructive" });
        if (data.error?.toLowerCase().includes("atual")) {
          setErrors(p => ({ ...p, currentPassword: data.error }));
        }
        return;
      }

      toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso. Faça login novamente." });
      logout();
      setLocation("/login");
    } catch {
      toast({ title: "Erro", description: "Erro de conexão. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <img src="/nexora-logo.png" alt="Nexora Field AI" className="w-[180px] h-[180px] object-contain" />
          </div>

          {/* Alert Banner */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <ShieldCheck className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-300">Alteração de senha obrigatória</p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Por segurança, você precisa definir uma nova senha antes de continuar.
                {user && <span> Olá, <strong>{user.name}</strong>.</span>}
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-5">Definir nova senha</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Senha Atual */}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Digite a senha atual"
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={e => { setCurrentPassword(e.target.value); setErrors(p => ({ ...p, currentPassword: "" })); }}
                  className={errors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12} /> {errors.currentPassword}</p>
              )}
            </div>

            {/* Nova Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: "", confirmPassword: "" })); }}
                  className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12} /> {errors.newPassword}</p>
              )}
            </div>

            {/* Confirmar */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12} /> {errors.confirmPassword}</p>
              )}
            </div>

            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                      newPassword.length >= level * 3
                        ? level <= 2 ? "bg-amber-500" : "bg-secondary"
                        : "bg-muted"
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newPassword.length < 8 ? "Muito curta" : newPassword.length < 12 ? "Fraca" : newPassword.length < 16 ? "Boa" : "Forte"}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Definir nova senha"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Nexora Field AI · <a href="mailto:suporte@nexorafield.com.br" className="hover:text-primary transition-colors">suporte@nexorafield.com.br</a>
        </p>
      </div>
    </div>
  );
}
