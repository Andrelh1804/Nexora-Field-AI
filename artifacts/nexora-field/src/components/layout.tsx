import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/nexora-logo.png" alt="Nexora Field" className="h-8" />
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/chamados" className="text-sm font-medium hover:text-primary transition-colors">Chamados</Link>
              <Link href="/tecnicos" className="text-sm font-medium hover:text-primary transition-colors">Técnicos</Link>
              <Link href="/perfil" className="text-sm font-medium hover:text-primary transition-colors">Perfil</Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin</Link>
              )}
              <Button variant="ghost" onClick={handleLogout}>Sair</Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Entrar</Link>
              <Link href="/register">
                <Button>Criar Conta</Button>
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>
    </div>
  );
}
