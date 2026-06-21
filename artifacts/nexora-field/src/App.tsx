import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { LandingLayout } from "@/components/landing-layout";
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
import Especialidades from "@/pages/especialidades";
import AdminEspecialidades from "@/pages/admin-especialidades";
import AdminAdministradores from "@/pages/admin-administradores";
import AdminPlanos from "@/pages/admin-planos";
import AdminLanding from "@/pages/admin-landing";
import AdminPagamentos from "@/pages/admin-pagamentos";
import Certificacoes from "@/pages/certificacoes";
import AdminCertificacoes from "@/pages/admin-certificacoes";
import RecuperarSenha from "@/pages/recuperar-senha";
import RedefinirSenha from "@/pages/redefinir-senha";
import { CookieBanner } from "@/components/cookie-banner";

import LandingSobre from "@/pages/landing-sobre";
import LandingComoFunciona from "@/pages/landing-como-funciona";
import LandingSolucoes from "@/pages/landing-solucoes";
import LandingEspecialidades from "@/pages/landing-especialidades";
import LandingFaq from "@/pages/landing-faq";
import LandingBlog from "@/pages/landing-blog";
import LandingContato from "@/pages/landing-contato";

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

  if (user.mustChangePassword && location !== "/alterar-senha") {
    setLocation("/alterar-senha");
    return null;
  }

  if (roles && !roles.includes(user.role) && !(user.role === "admin_master" && roles.includes("admin"))) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl">🔒</p>
        <p className="text-muted-foreground mt-2">Acesso não autorizado.</p>
      </div>
    );
  }

  return <Component />;
}

function AppRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground animate-pulse">Carregando...</div>
    </div>
  );

  setLocation(user ? "/dashboard" : "/login");
  return null;
}

function PlatformRoutes() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/alterar-senha" component={AlterarSenha} />
      <Route component={() => (
        <Layout>
          <Switch>
            <Route path="/" component={AppRedirect} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/recuperar-senha" component={RecuperarSenha} />
            <Route path="/redefinir-senha" component={RedefinirSenha} />
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
            <Route path="/especialidades" component={() => <ProtectedRoute component={Especialidades} roles={["technician"]} />} />
            <Route path="/admin/especialidades" component={() => <ProtectedRoute component={AdminEspecialidades} roles={["admin"]} />} />
            <Route path="/admin/administradores" component={() => <ProtectedRoute component={AdminAdministradores} roles={["admin"]} />} />
            <Route path="/admin/planos" component={() => <ProtectedRoute component={AdminPlanos} roles={["admin"]} />} />
            <Route path="/admin/landing" component={() => <ProtectedRoute component={AdminLanding} roles={["admin"]} />} />
            <Route path="/admin/pagamentos" component={() => <ProtectedRoute component={AdminPagamentos} roles={["admin"]} />} />
            <Route path="/certificacoes" component={() => <ProtectedRoute component={Certificacoes} roles={["technician"]} />} />
            <Route path="/admin/certificacoes" component={() => <ProtectedRoute component={AdminCertificacoes} roles={["admin"]} />} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )} />
    </Switch>
  );
}

const APP_BASE = "/app";

function AppSection() {
  return (
    <WouterRouter base={APP_BASE}>
      <PlatformRoutes />
    </WouterRouter>
  );
}

function LandingRedirectLogin() {
  window.location.replace("/app/login");
  return null;
}

function LandingRedirectCadastro() {
  window.location.replace("/app/register");
  return null;
}

function LandingRoutes() {
  return (
    <LandingLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sobre" component={LandingSobre} />
        <Route path="/como-funciona" component={LandingComoFunciona} />
        <Route path="/solucoes" component={LandingSolucoes} />
        <Route path="/especialidades" component={LandingEspecialidades} />
        <Route path="/faq" component={LandingFaq} />
        <Route path="/blog" component={LandingBlog} />
        <Route path="/contato" component={LandingContato} />
        <Route path="/planos" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Planos />
          </div>
        )} />
        <Route path="/ranking" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Ranking />
          </div>
        )} />
        <Route path="/academy" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Academy />
          </div>
        )} />
        <Route path="/comunidade" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Community />
          </div>
        )} />
        <Route path="/conhecimento" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Conhecimento />
          </div>
        )} />
        <Route path="/privacidade" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Privacidade />
          </div>
        )} />
        <Route path="/termos" component={() => (
          <div className="py-10 px-4 max-w-7xl mx-auto">
            <Termos />
          </div>
        )} />
        <Route path="/login" component={LandingRedirectLogin} />
        <Route path="/cadastro" component={LandingRedirectCadastro} />
        <Route component={() => (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-6xl mb-4">404</p>
            <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
            <p className="text-slate-400 mb-6">A página que você procura não existe.</p>
            <a href="/" className="text-primary hover:underline">← Voltar ao início</a>
          </div>
        )} />
      </Switch>
    </LandingLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/app" component={AppSection} />
      <Route path="/app/:rest*" component={AppSection} />
      <Route component={LandingRoutes} />
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
