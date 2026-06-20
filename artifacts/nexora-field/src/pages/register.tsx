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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
    if (!acceptedTerms) errors.terms = "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.";
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
      <div className="flex justify-center mb-8 pt-2">
        <img src="/nexora-logo.png" alt="Nexora Field" className="w-[220px] h-auto" />
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

        {/* Perfil */}
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

        {/* Aceite dos Termos — LGPD */}
        <div className="space-y-1.5 pt-1">
          <label
            className={`flex items-start gap-3 cursor-pointer group p-3 rounded-lg border transition-colors ${
              fieldErrors.terms
                ? "border-destructive bg-destructive/5"
                : acceptedTerms
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => {
                  setAcceptedTerms(e.target.checked);
                  setFieldErrors(p => ({ ...p, terms: "" }));
                }}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  acceptedTerms
                    ? "bg-primary border-primary"
                    : fieldErrors.terms
                    ? "border-destructive"
                    : "border-muted-foreground group-hover:border-primary/60"
                }`}
              >
                {acceptedTerms && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              Li e concordo com os{" "}
              <Link
                href="/termos"
                target="_blank"
                className="text-primary hover:underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                className="text-primary hover:underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                Política de Privacidade
              </Link>{" "}
              da Nexora Field AI, incluindo o tratamento dos meus dados conforme a{" "}
              <span className="font-medium text-foreground/70">LGPD (Lei nº 13.709/2018)</span>.
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle size={12} /> {fieldErrors.terms}
            </p>
          )}
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
