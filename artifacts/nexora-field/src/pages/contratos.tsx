import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  ativo: { label: "Ativo", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  suspenso: { label: "Suspenso", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  encerrado: { label: "Encerrado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  renovando: { label: "Renovando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export default function Contratos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", companyId: "", value: "", monthlyValue: "", maxOrdersPerMonth: "", slaHours: "24", startDate: new Date().toISOString().slice(0, 10), notes: "" });

  const { data: contracts = [], isLoading } = useQuery({ queryKey: ["contracts"], queryFn: () => authFetch("/api/contracts") });

  const createContract = useMutation({
    mutationFn: (data: any) => authFetch("/api/contracts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setShowNew(false); toast({ title: "Contrato criado!", description: "Contrato Enterprise ativo." }); }
  });

  const totalMRR = contracts.reduce((s: number, c: any) => s + ((c.contract?.monthlyValue || 0)), 0);
  const activeCount = contracts.filter((c: any) => c.contract?.status === "ativo").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">📋 Contratos Enterprise</h1>
          <p className="text-muted-foreground mt-1">Gestão de contratos corporativos</p>
        </div>
        {user?.role === "admin" && <Button onClick={() => setShowNew(!showNew)}>+ Novo Contrato</Button>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Contratos Ativos</p><p className="text-2xl font-bold text-green-400">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">MRR Total</p><p className="text-2xl font-bold">R$ {(totalMRR / 1000).toFixed(1)}k</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">ARR Projetado</p><p className="text-2xl font-bold text-primary">R$ {(totalMRR * 12 / 1000).toFixed(0)}k</p></CardContent></Card>
      </div>

      {showNew && user?.role === "admin" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle>Novo Contrato Enterprise</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Título do contrato *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="ID da empresa *" type="number" value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))} />
              <Input placeholder="Valor total (R$)" type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
              <Input placeholder="MRR (R$/mês)" type="number" value={form.monthlyValue} onChange={e => setForm(p => ({ ...p, monthlyValue: e.target.value }))} />
              <Input placeholder="Chamados/mês (max)" type="number" value={form.maxOrdersPerMonth} onChange={e => setForm(p => ({ ...p, maxOrdersPerMonth: e.target.value }))} />
              <Input placeholder="SLA (horas)" type="number" value={form.slaHours} onChange={e => setForm(p => ({ ...p, slaHours: e.target.value }))} />
              <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <Input placeholder="Notas" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex gap-2">
              <Button onClick={() => createContract.mutate({ ...form, companyId: Number(form.companyId), value: Number(form.value), monthlyValue: form.monthlyValue ? Number(form.monthlyValue) : undefined, maxOrdersPerMonth: form.maxOrdersPerMonth ? Number(form.maxOrdersPerMonth) : undefined, slaHours: Number(form.slaHours) })} disabled={!form.title || !form.companyId || createContract.isPending}>
                {createContract.isPending ? "Criando..." : "Criar Contrato"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="animate-pulse text-muted-foreground">Carregando contratos...</div> : (
        <div className="space-y-3">
          {contracts.map((item: any) => {
            const c = item.contract || item;
            return (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{c.title}</p>
                        <Badge className={`text-xs border ${STATUS_CONFIG[c.status]?.color}`}>{STATUS_CONFIG[c.status]?.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{c.number}</p>
                      {item.company?.name && <p className="text-sm text-muted-foreground">{item.company?.name}</p>}
                    </div>
                    <div className="text-right space-y-1">
                      {c.monthlyValue && <p className="text-green-400 font-semibold">R$ {Number(c.monthlyValue).toLocaleString("pt-BR")}/mês</p>}
                      <p className="text-xs text-muted-foreground">SLA: {c.slaHours}h · Início: {new Date(c.startDate).toLocaleDateString("pt-BR")}</p>
                      {c.maxOrdersPerMonth && <p className="text-xs text-muted-foreground">Até {c.maxOrdersPerMonth} chamados/mês</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {contracts.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum contrato encontrado.</p>}
        </div>
      )}
    </div>
  );
}
