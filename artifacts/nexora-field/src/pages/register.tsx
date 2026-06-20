import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, RegisterInputRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterInputRole>("company");
  const registerMutation = useRegister();
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await registerMutation.mutateAsync({ data: { name, email, password, role } });
      setToken(response.token);
      toast({ title: "Sucesso", description: "Conta criada com sucesso." });
      setLocation("/dashboard");
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar a conta.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-card rounded-lg border shadow-sm">
      <div className="flex justify-center mb-8">
        <img src="/nexora-logo.png" alt="Nexora Field" className="w-[300px]" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Perfil</Label>
          <Select value={role} onValueChange={(v) => setRole(v as RegisterInputRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="technician">Técnico</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Registrando..." : "Registrar"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Já tem uma conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
      </div>
    </div>
  );
}
