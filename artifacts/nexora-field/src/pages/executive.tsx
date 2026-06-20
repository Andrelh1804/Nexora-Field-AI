import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const STATUS_COLORS: Record<string, string> = { aberto: "#3B82F6", aceito: "#EAB308", em_andamento: "#F97316", finalizado: "#22C55E", cancelado: "#EF4444" };
const STATUS_LABELS: Record<string, string> = { aberto: "Aberto", aceito: "Aceito", em_andamento: "Em And.", finalizado: "Finalizado", cancelado: "Cancelado" };

const QUICK_QUESTIONS = [
  "Como está a performance dos técnicos este mês?",
  "Quais regiões têm maior demanda de chamados?",
  "Como aumentar a receita da plataforma?",
  "Qual o ticket médio dos chamados?",
  "Análise de churn e retenção de clientes",
];

export default function Executive() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const { data: insights } = useQuery({ queryKey: ["executive-insights"], queryFn: () => authFetch("/api/executive/insights") });
  const ask = useMutation({
    mutationFn: (q: string) => authFetch("/api/executive/ask", { method: "POST", body: JSON.stringify({ question: q }) }),
    onSuccess: (data) => setAnswer(data.answer),
  });

  const statusData = insights?.statusDistribution?.map((s: any) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: Number(s.cnt),
    fill: STATUS_COLORS[s.status] || "#888",
  })) || [];

  const monthlyData = insights?.monthlyTrend?.map((m: any) => ({
    name: new Date(m.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    chamados: Number(m.cnt),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">🧠 Executive AI</h1>
        <p className="text-muted-foreground mt-1">Inteligência executiva em tempo real</p>
      </div>

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Chamados", value: insights.summary?.totalOrders, color: "text-blue-400", icon: "📋" },
            { label: "Técnicos", value: insights.summary?.totalTechnicians, color: "text-green-400", icon: "👨‍🔧" },
            { label: "Empresas", value: insights.summary?.totalCompanies, color: "text-purple-400", icon: "🏢" },
            { label: "Usuários", value: insights.summary?.totalUsers, color: "text-yellow-400", icon: "👥" },
            { label: "Avg Rating", value: `${insights.summary?.avgRating}⭐`, color: "text-orange-400", icon: "⭐" },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="pt-4 space-y-1">
                <p className="text-xl">{m.icon}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statusData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Distribuição de Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                    {statusData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Tendência Mensal (6 meses)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="chamados" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💬</span> Pergunte à IA Executiva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => setQuestion(q)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground">
                {q}
              </button>
            ))}
          </div>
          <Textarea placeholder="Faça uma pergunta estratégica sobre a plataforma..." value={question} onChange={e => setQuestion(e.target.value)} rows={3} />
          <Button onClick={() => ask.mutate(question)} disabled={!question.trim() || ask.isPending} className="w-full sm:w-auto">
            {ask.isPending ? "Analisando..." : "🧠 Analisar"}
          </Button>

          {answer && (
            <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <span>🤖</span> Análise Executiva
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
