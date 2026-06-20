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

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div>Carregando...</div>;
  
  if (!user) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/chamados" component={() => <ProtectedRoute component={Chamados} />} />
        <Route path="/chamados/novo" component={() => <ProtectedRoute component={ChamadoNovo} />} />
        <Route path="/chamados/:id" component={() => <ProtectedRoute component={ChamadoDetail} />} />
        <Route path="/tecnicos" component={() => <ProtectedRoute component={Tecnicos} />} />
        <Route path="/tecnicos/:id" component={() => <ProtectedRoute component={TecnicoProfile} />} />
        <Route path="/perfil" component={() => <ProtectedRoute component={Perfil} />} />
        <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
