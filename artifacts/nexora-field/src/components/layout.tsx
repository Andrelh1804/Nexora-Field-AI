import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetUnreadCount } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function NotificationBell({ userId }: { userId: number }) {
  const { data } = useGetUnreadCount({ query: { queryKey: ["notifications", "unread", userId], refetchInterval: 30000 } });
  const count = data?.count || 0;

  return (
    <Link href="/notificacoes" className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 transition-colors">
      <span className="text-lg">🔔</span>
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0 rounded-full">
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const isActive = (path: string) => location === path ? "text-primary" : "text-muted-foreground hover:text-foreground";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/nexora-logo.png" alt="Nexora Field" className="h-7" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <Link href="/dashboard" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/dashboard")}`}>
                Dashboard
              </Link>
              <Link href="/chamados" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/chamados")}`}>
                Chamados
              </Link>
              <Link href="/mapa" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/mapa")}`}>
                Mapa
              </Link>
              <Link href="/tecnicos" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/tecnicos")}`}>
                Técnicos
              </Link>
              <Link href="/ranking" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/ranking")}`}>
                Ranking
              </Link>
              {user.role === "technician" && (
                <Link href="/carteira" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/carteira")}`}>
                  Carteira
                </Link>
              )}
              <Link href="/planos" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/planos")}`}>
                Planos
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/admin")}`}>
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/ranking" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/ranking")}`}>
                Ranking
              </Link>
              <Link href="/planos" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive("/planos")}`}>
                Planos
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <Link href="/perfil">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold cursor-pointer hover:bg-primary/30 transition-colors">
                  {user.name[0]}
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Criar Conta</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>

      <footer className="border-t border-border py-4 px-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>© 2026 Nexora Field AI · Todos os direitos reservados</span>
        <div className="flex items-center gap-4">
          <Link href="/planos" className="hover:text-foreground transition-colors">Planos</Link>
          <Link href="/ranking" className="hover:text-foreground transition-colors">Ranking</Link>
          <Link href="/mapa" className="hover:text-foreground transition-colors">Mapa</Link>
        </div>
      </footer>
    </div>
  );
}
