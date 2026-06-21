import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function RedefinirSenha() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setError("Link inválido ou expirado. Solicite um novo.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast({ title: "Senha deve ter ao menos 8 caracteres", variant: "destructive" }); return; }
    if (password !== confirm) { toast({ title: "As senhas não coincidem", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(d.error ?? "Token inválido ou expirado.");
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/nexora-logo.png" alt="Nexora Field AI" className="h-20 w-20" />
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {done ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-3">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sua senha foi atualizada com sucesso. Faça login com sua nova senha.
              </p>
              <Link href="/login">
                <Button className="w-full">Ir para o login</Button>
              </Link>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-3">Link inválido</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Link href="/recuperar-senha">
                <Button variant="outline" className="w-full">Solicitar novo link</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Nova senha</h2>
                <p className="text-sm text-muted-foreground">
                  Escolha uma senha segura com pelo menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type={showPass ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                </div>

                {password.length > 0 && confirm.length > 0 && password !== confirm && (
                  <p className="text-xs text-destructive">As senhas não coincidem.</p>
                )}

                <Button type="submit" className="w-full" disabled={loading || !token}>
                  {loading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
