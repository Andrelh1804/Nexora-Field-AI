import { useAuth } from "@/lib/auth";
import { useGetAdminDashboard, useGetCompanyDashboard, useGetTechnicianDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AdminDashboardView() {
  const { data, isLoading } = useGetAdminDashboard();
  if (isLoading || !data) return <div>Carregando...</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader><CardTitle>Técnicos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.totalTechnicians}</CardContent></Card>
      <Card><CardHeader><CardTitle>Empresas</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.totalCompanies}</CardContent></Card>
      <Card><CardHeader><CardTitle>Chamados</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.totalServiceOrders}</CardContent></Card>
      <Card><CardHeader><CardTitle>Receita</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-500">R$ {data.revenueSimulated.toFixed(2)}</CardContent></Card>
    </div>
  );
}

function CompanyDashboardView() {
  const { data, isLoading } = useGetCompanyDashboard();
  if (isLoading || !data) return <div>Carregando...</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader><CardTitle>Chamados Ativos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.activeOrders}</CardContent></Card>
      <Card><CardHeader><CardTitle>Concluídos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.finishedOrders}</CardContent></Card>
      <Card><CardHeader><CardTitle>Gasto Total</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-blue-500">R$ {data.totalSpent.toFixed(2)}</CardContent></Card>
    </div>
  );
}

function TechnicianDashboardView() {
  const { data, isLoading } = useGetTechnicianDashboard();
  if (isLoading || !data) return <div>Carregando...</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader><CardTitle>Disponíveis</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.availableOrders}</CardContent></Card>
      <Card><CardHeader><CardTitle>Concluídos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.completedOrders}</CardContent></Card>
      <Card><CardHeader><CardTitle>Ganhos</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-500">R$ {data.totalEarnings.toFixed(2)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Avaliação</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.rating?.toFixed(1) || '-'}</CardContent></Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user.role === "admin" && <AdminDashboardView />}
      {user.role === "company" && <CompanyDashboardView />}
      {user.role === "technician" && <TechnicianDashboardView />}
    </div>
  );
}
