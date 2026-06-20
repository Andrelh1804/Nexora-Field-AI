import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Chamados from "@/pages/chamados";
import ChamadoNovo from "@/pages/chamado-novo";
import ChamadoDetail from "@/pages/chamado-detail";
import Tecnicos from "@/pages/tecnicos";
import TecnicoProfile from "@/pages/tecnico-profile";
import Perfil from "@/pages/perfil";
import Admin from "@/pages/admin";
import Mapa from "@/pages/mapa";
import Ranking from "@/pages/ranking";
import Planos from "@/pages/planos";
import Carteira from "@/pages/carteira";
import Notificacoes from "@/pages/notificacoes";
import Academy from "@/pages/academy";
import Community from "@/pages/community";
import Crm from "@/pages/crm";
import Contratos from "@/pages/contratos";
import Developer from "@/pages/developer";
import Executive from "@/pages/executive";
import Copilot from "@/pages/copilot";
import Visao from "@/pages/visao";
import Onboarding from "@/pages/onboarding";
import Conhecimento from "@/pages/conhecimento";
import AlterarSenha from "@/pages/alterar-senha";
import Privacidade from "@/pages/privacidade";
import Termos from "@/pages/termos";
import { CookieBanner } from "@/components/cookie-banner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground animate-pulse">Carregando...</div>
    </div>
  );

  if (!user) {
    setLocation("/login");
    return null;
  }

  // Force password change — redirect to change-password page
  if (user.mustChangePassword && location !== "/alterar-senha") {
    setLocation("/alterar-senha");
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl">🔒</p>
        <p className="text-muted-foreground mt-2">Acesso não autorizado.</p>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/alterar-senha" component={AlterarSenha} />
      <Route component={() => (
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/ranking" component={Ranking} />
            <Route path="/planos" component={Planos} />
            <Route path="/mapa" component={Mapa} />
            <Route path="/academy" component={Academy} />
            <Route path="/comunidade" component={Community} />
            <Route path="/conhecimento" component={Conhecimento} />
            <Route path="/privacidade" component={Privacidade} />
            <Route path="/termos" component={Termos} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/chamados" component={() => <ProtectedRoute component={Chamados} />} />
            <Route path="/chamados/novo" component={() => <ProtectedRoute component={ChamadoNovo} roles={["company"]} />} />
            <Route path="/chamados/:id" component={() => <ProtectedRoute component={ChamadoDetail} />} />
            <Route path="/tecnicos" component={() => <ProtectedRoute component={Tecnicos} />} />
            <Route path="/tecnicos/:id" component={() => <ProtectedRoute component={TecnicoProfile} />} />
            <Route path="/perfil" component={() => <ProtectedRoute component={Perfil} />} />
            <Route path="/admin" component={() => <ProtectedRoute component={Admin} roles={["admin"]} />} />
            <Route path="/carteira" component={() => <ProtectedRoute component={Carteira} />} />
            <Route path="/notificacoes" component={() => <ProtectedRoute component={Notificacoes} />} />
            <Route path="/copilot" component={() => <ProtectedRoute component={Copilot} />} />
            <Route path="/visao" component={() => <ProtectedRoute component={Visao} />} />
            <Route path="/contratos" component={() => <ProtectedRoute component={Contratos} />} />
            <Route path="/crm" component={() => <ProtectedRoute component={Crm} roles={["admin"]} />} />
            <Route path="/developer" component={() => <ProtectedRoute component={Developer} />} />
            <Route path="/executive" component={() => <ProtectedRoute component={Executive} roles={["admin"]} />} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
        <CookieBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
