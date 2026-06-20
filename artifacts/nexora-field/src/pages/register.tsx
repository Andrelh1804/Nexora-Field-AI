import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

type PublicRole = "company" | "technician";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const urlRole = new URLSearchParams(window.location.search).get("role");
  const initialRole: PublicRole = urlRole === "technician" ? "technician" : "company";
  const [role, setRole] = useState<PublicRole>(initialRole);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const registerMutation = useRegister();
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errors.name = "Nome deve ter pelo menos 2 caracteres.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) errors.email = "Informe um e-mail válido.";
    if (!password || password.length < 8) errors.password = "A senha deve ter pelo menos 8 caracteres.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await registerMutation.mutateAsync({
        data: { name: name.trim(), email: email.toLowerCase(), password, role },
      });
      setToken(response.token);
      toast({ title: "Conta criada!", description: "Bem-vindo(a) à Nexora Field AI." });
      setLocation("/onboarding");
    } catch (error: any) {
      const msg = error?.data?.error || error?.message || "Não foi possível criar a conta.";
      toast({ title: "Erro no cadastro", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-card rounded-xl border border-border shadow-lg">
      <div className="flex justify-center mb-8">
        <img src="/nexora-logo.png" alt="Nexora Field" className="w-[260px]" />
      </div>

      <h2 className="text-xl font-semibold text-center text-foreground mb-6">Criar sua conta</h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nome */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            placeholder="Seu nome"
            value={name}
            onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); }}
            className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.name && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle size={12} /> {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
            className={fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.password && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle size={12} /> {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Perfil — apenas Empresa e Técnico */}
        <div className="space-y-1.5">
          <Label>Perfil</Label>
          <Select value={role} onValueChange={v => setRole(v as PublicRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="technician">Técnico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </div>
    </div>
  );
}
