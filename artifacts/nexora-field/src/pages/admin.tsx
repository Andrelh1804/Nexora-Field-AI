import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  aberto: "#3B82F6", aceito: "#EAB308", em_andamento: "#F97316",
  finalizado: "#22C55E", cancelado: "#EF4444",
};
const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto", aceito: "Aceito", em_andamento: "Em Andamento",
  finalizado: "Finalizado", cancelado: "Cancelado",
};
const CATEGORY_COLORS = ["#3B82F6","#8B5CF6","#F97316","#EAB308","#22C55E","#06B6D4"];

function FinancialMetric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function Admin() {
  const { data, isLoading } = useGetAdminDashboard();
  if (isLoading || !data) return <div className="animate-pulse text-muted-foreground">Carregando dados admin...</div>;

  const gmv = data.revenueSimulated;
  const takeRate = 0.15;
  const mrr = gmv * 0.12;
  const arr = mrr * 12;
  const avgTicket = data.totalServiceOrders > 0 ? gmv / data.totalServiceOrders : 0;

  const statusData = data.ordersByStatus.map(s => ({
    name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || "#888",
  }));
  const categoryData = data.ordersByCategory.map((c, i) => ({
    name: c.category.replace(/_/g, " "), value: c.count, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={async () => {
              const token = localStorage.getItem("nexora_token");
              const res = await fetch("/api/reports/executive", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
              if (!res.ok) { alert("Erro ao gerar relatório executivo."); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `relatorio-executivo-${new Date().toISOString().slice(0,10)}.pdf`; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Relatório Executivo
          </Button>
          <Badge variant="outline" className="text-primary border-primary/30">Admin</Badge>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><FinancialMetric label="Técnicos" value={String(data.totalTechnicians)} sub="cadastrados" /></CardContent></Card>
        <Card><CardContent className="pt-4"><FinancialMetric label="Empresas" value={String(data.totalCompanies)} sub="ativas" /></CardContent></Card>
        <Card><CardContent className="pt-4"><FinancialMetric label="Chamados" value={String(data.totalServiceOrders)} sub="total" /></CardContent></Card>
        <Card><CardContent className="pt-4"><FinancialMetric label="GMV" value={`R$ ${gmv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-green-400" sub="volume bruto" /></CardContent></Card>
      </div>

      {/* Financial KPIs */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="text-base">FinOps Dashboard</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <FinancialMetric label="MRR" value={`R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-blue-400" sub="receita mensal recorrente" />
            <FinancialMetric label="ARR" value={`R$ ${arr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-purple-400" sub="receita anual recorrente" />
            <FinancialMetric label="Take Rate" value={`${(takeRate * 100).toFixed(0)}%`} color="text-yellow-400" sub="comissão plataforma" />
            <FinancialMetric label="Ticket Médio" value={`R$ ${avgTicket.toFixed(2)}`} color="text-green-400" sub="por chamado" />
          </div>
          <div className="border-t border-border mt-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            <FinancialMetric label="Receita Nexora" value={`R$ ${(gmv * takeRate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-green-400" sub={`${takeRate*100}% do GMV`} />
            <FinancialMetric label="Repassado Técnicos" value={`R$ ${(gmv * (1 - takeRate)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub="85% do GMV" />
            <FinancialMetric label="Churn Estimado" value="4.2%" color="text-red-400" sub="mensal simulado" />
            <FinancialMetric label="LTV Estimado" value={`R$ ${(avgTicket * 24).toFixed(0)}`} sub="24 meses média" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Chamados" radius={[0, 4, 4, 0]}>
                  {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader><CardTitle className="text-base">Últimos Chamados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentOrders.slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.city}, {o.state} · {new Date(o.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {o.value && <span className="text-sm font-medium text-green-400">R$ {Number(o.value).toFixed(2)}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
