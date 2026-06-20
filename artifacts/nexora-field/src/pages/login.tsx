import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loginMutation = useLogin();
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const validate = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) errors.email = "Informe um e-mail válido.";
    if (!password) errors.password = "A senha é obrigatória.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await loginMutation.mutateAsync({ data: { email: email.toLowerCase(), password } });
      setToken(response.token);
      toast({ title: "Bem-vindo(a)!", description: "Login realizado com sucesso." });
      setLocation("/dashboard");
    } catch (error: any) {
      const status = error?.status;
      let msg = "Não foi possível fazer login. Tente novamente.";
      if (status === 401) msg = "E-mail ou senha incorretos.";
      else if (status === 400) msg = error?.data?.error || "Dados inválidos.";
      else if (status === 429) msg = "Muitas tentativas. Aguarde alguns minutos.";
      toast({ title: "Falha no login", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-card rounded-xl border border-border shadow-lg">
      <div className="flex justify-center mb-8 pt-2">
        <img src="/nexora-logo.png" alt="Nexora Field" className="w-[200px] h-[200px] object-contain" />
      </div>

      <h2 className="text-xl font-semibold text-center text-foreground mb-6">Entrar na plataforma</h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            autoComplete="email"
            onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
            className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.email && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle size={12} /> {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            autoComplete="current-password"
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
            className={fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.password && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle size={12} /> {fieldErrors.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        Não tem uma conta?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
