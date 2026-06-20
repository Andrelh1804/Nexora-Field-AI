import { useAuth } from "@/lib/auth";
import {
  useGetAdminDashboard, useGetCompanyDashboard, useGetTechnicianDashboard,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  aberto: "#3B82F6", aceito: "#EAB308", em_andamento: "#F97316",
  finalizado: "#22C55E", cancelado: "#EF4444",
};
const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto", aceito: "Aceito", em_andamento: "Em Andamento",
  finalizado: "Finalizado", cancelado: "Cancelado",
};
const CATEGORY_COLORS = ["#3B82F6","#8B5CF6","#F97316","#EAB308","#22C55E","#06B6D4"];

function StatCard({ title, value, sub, color }: { title: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${color || ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AdminDashboardView() {
  const { data, isLoading } = useGetAdminDashboard();
  if (isLoading || !data) return <div className="animate-pulse text-muted-foreground">Carregando...</div>;

  const statusData = data.ordersByStatus.map(s => ({
    name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || "#888",
  }));
  const categoryData = data.ordersByCategory.map((c, i) => ({
    name: c.category.replace(/_/g, " "), value: c.count, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  // Simulated MRR trend
  const mrrTrend = [
    { month: "Jan", mrr: 4200 }, { month: "Fev", mrr: 5800 }, { month: "Mar", mrr: 7200 },
    { month: "Abr", mrr: 8900 }, { month: "Mai", mrr: 11200 }, { month: "Jun", mrr: Math.round(data.revenueSimulated * 0.12) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Técnicos" value={data.totalTechnicians} sub="cadastrados" />
        <StatCard title="Empresas" value={data.totalCompanies} sub="ativas" />
        <StatCard title="Chamados" value={data.totalServiceOrders} sub="total" />
        <StatCard title="GMV Simulado" value={`R$ ${data.revenueSimulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-green-400" sub="volume bruto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [v, "Chamados"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Chamados" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tendência de Receita (simulado)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mrrTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Line type="monotone" dataKey="mrr" stroke="#1A6FE8" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/ranking"><Button variant="outline" className="w-full">🏆 Ver Ranking</Button></Link>
        <Link href="/mapa"><Button variant="outline" className="w-full">🗺️ Ver Mapa</Button></Link>
        <Link href="/admin"><Button variant="outline" className="w-full">⚙️ Admin Panel</Button></Link>
      </div>
    </div>
  );
}

function CompanyDashboardView() {
  const { data, isLoading } = useGetCompanyDashboard();
  if (isLoading || !data) return <div className="animate-pulse text-muted-foreground">Carregando...</div>;

  const statusData = data.ordersByStatus.map(s => ({
    name: STATUS_LABELS[s.status] || s.status, value: s.count, fill: STATUS_COLORS[s.status] || "#888",
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Chamados Ativos" value={data.activeOrders} color="text-primary" />
        <StatCard title="Concluídos" value={data.finishedOrders} color="text-green-400" />
        <StatCard title="Gasto Total" value={`R$ ${data.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-blue-400" />
        <StatCard title="Técnicos Usados" value={data.technicianCount} sub="diferentes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Chamados" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Últimos Chamados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentOrders.slice(0, 5).map((o: any) => (
                <Link key={o.id} href={`/chamados/${o.id}`}>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/30 cursor-pointer">
                    <span className="text-sm truncate max-w-[200px]">{o.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ? "" : ""}`}
                      style={{ background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/chamados/novo"><Button className="w-full">+ Novo Chamado</Button></Link>
        <Link href="/planos"><Button variant="outline" className="w-full">💳 Ver Planos</Button></Link>
      </div>
    </div>
  );
}

function TechnicianDashboardView() {
  const { data, isLoading } = useGetTechnicianDashboard();
  if (isLoading || !data) return <div className="animate-pulse text-muted-foreground">Carregando...</div>;

  // Simulate performance trend
  const performanceTrend = [
    { month: "Jan", chamados: 3, ganhos: 1200 },
    { month: "Fev", chamados: 5, ganhos: 2100 },
    { month: "Mar", chamados: 4, ganhos: 1800 },
    { month: "Abr", chamados: 7, ganhos: 3200 },
    { month: "Mai", chamados: 6, ganhos: 2900 },
    { month: "Jun", chamados: data.completedOrders, ganhos: Math.round(data.totalEarnings * 0.2) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Disponíveis" value={data.availableOrders} sub="chamados abertos" color="text-primary" />
        <StatCard title="Concluídos" value={data.completedOrders} sub="total" color="text-green-400" />
        <StatCard title="Ganhos" value={`R$ ${data.totalEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-green-400" />
        <StatCard title="Avaliação" value={data.rating ? `${data.rating.toFixed(1)} ★` : "—"} sub="média geral" color="text-yellow-400" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Performance (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="chamados" name="Chamados" fill="#1A6FE8" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="ganhos" name="Ganhos (R$)" fill="#7DC242" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/chamados"><Button className="w-full">Ver Chamados</Button></Link>
        <Link href="/ranking"><Button variant="outline" className="w-full">🏆 Ranking</Button></Link>
        <Link href="/carteira"><Button variant="outline" className="w-full">💰 Carteira</Button></Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Bem-vindo, {user.name}</p>
      </div>
      {user.role === "admin" && <AdminDashboardView />}
      {user.role === "company" && <CompanyDashboardView />}
      {user.role === "technician" && <TechnicianDashboardView />}
    </div>
  );
}
