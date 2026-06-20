import { useAuth } from "@/lib/auth";

export default function Perfil() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Meu Perfil</h1>
      <p className="text-muted-foreground">Configurações e dados do perfil em breve.</p>
      <div className="bg-card border border-border p-6 rounded-lg">
        <p><strong>Nome:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Papel:</strong> {user.role}</p>
      </div>
    </div>
  );
}
