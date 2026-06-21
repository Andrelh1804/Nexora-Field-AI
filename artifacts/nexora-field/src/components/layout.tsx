import { useState } from "react";
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

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
      {label}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const mainLinks = user ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chamados", label: "Chamados" },
    { href: "/mapa", label: "Mapa" },
    { href: "/tecnicos", label: "Técnicos" },
    { href: "/ranking", label: "Ranking" },
  ] : [
    { href: "/ranking", label: "Ranking" },
    { href: "/planos", label: "Planos" },
    { href: "/academy", label: "Academy" },
    { href: "/comunidade", label: "Comunidade" },
  ];

  const roleLinks = user ? [
    ...(user.role === "technician" ? [
      { href: "/especialidades", label: "⚡ Especialidades" },
      { href: "/carteira", label: "💰 Carteira" },
      { href: "/copilot", label: "🤖 Copiloto" },
      { href: "/visao", label: "👁️ Visão IA" },
    ] : []),
    ...(user.role === "company" ? [
      { href: "/contratos", label: "📋 Contratos" },
    ] : []),
    ...(user.role === "admin" || user.role === "admin_master" ? [
      { href: "/admin", label: "⚡ Admin" },
      { href: "/admin/administradores", label: "👥 Administradores" },
      { href: "/admin/planos", label: "💳 Planos" },
      { href: "/admin/landing", label: "🌐 Landing CMS" },
      { href: "/admin/especialidades", label: "🗂️ Especialidades" },
      { href: "/executive", label: "🧠 Executive" },
      { href: "/crm", label: "🎯 CRM" },
      { href: "/contratos", label: "📋 Contratos" },
    ] : []),
    { href: "/academy", label: "🎓 Academy" },
    { href: "/comunidade", label: "💬 Comunidade" },
    { href: "/conhecimento", label: "📚 Conhecimento" },
    { href: "/planos", label: "Planos" },
    { href: "/developer", label: "⚙️ Dev" },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        {user ? (
          <Link href="/" className="flex items-center gap-2">
            <img src="/nexora-logo.png" alt="Nexora Field" className="h-11 w-11" />
          </Link>
        ) : (
          <a href="/landing/" className="flex items-center gap-2">
            <img src="/nexora-logo.png" alt="Nexora Field" className="h-11 w-11" />
          </a>
        )}

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainLinks.map(l => <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />)}
          {roleLinks.length > 0 && (
            <div className="relative group ml-1">
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1">
                Mais ▾
              </button>
              <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[180px] hidden group-hover:flex flex-col gap-0.5 z-50">
                {roleLinks.map(l => (
                  <Link key={l.href} href={l.href} className={`px-3 py-2 rounded-lg text-sm transition-colors ${isActive(l.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
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
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex text-muted-foreground hover:text-foreground">
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
          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted/50" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-card px-4 py-3 flex flex-col gap-1 z-40">
          {[...mainLinks, ...roleLinks].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(l.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              {l.label}
            </Link>
          ))}
          {user && <button onClick={handleLogout} className="text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50">Sair</button>}
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>

      <footer className="border-t border-border py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Nexora Field AI · CNPJ 58.453.955/0001-84 · Todos os direitos reservados</span>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
          <Link href="/planos" className="hover:text-foreground transition-colors">Planos</Link>
          <Link href="/ranking" className="hover:text-foreground transition-colors">Ranking</Link>
          <Link href="/academy" className="hover:text-foreground transition-colors">Academy</Link>
        </div>
      </footer>
    </div>
  );
}
