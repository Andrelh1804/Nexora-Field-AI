import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  novo: { label: "Novo", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  qualificado: { label: "Qualificado", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  proposta: { label: "Proposta", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  negociacao: { label: "Negociação", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  ganho: { label: "Ganho", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  perdido: { label: "Perdido", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const STATUSES = Object.keys(STATUS_CONFIG);

export default function Crm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", position: "", source: "organico", estimatedValue: "", notes: "" });

  const { data: leads = [], isLoading } = useQuery({ queryKey: ["crm", filterStatus], queryFn: () => authFetch(`/api/crm/leads?${filterStatus !== "todos" ? `status=${filterStatus}` : ""}&limit=50`) });
  const { data: activities = [] } = useQuery({ queryKey: ["crm-acts", selected?.id], queryFn: () => authFetch(`/api/crm/leads/${selected?.id}/activities`), enabled: !!selected });

  const createLead = useMutation({ mutationFn: (data: any) => authFetch("/api/crm/leads", { method: "POST", body: JSON.stringify(data) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm"] }); setShowNew(false); setForm({ name: "", email: "", phone: "", company: "", position: "", source: "organico", estimatedValue: "", notes: "" }); toast({ title: "Lead criado!" }); } });
  const updateStatus = useMutation({ mutationFn: ({ id, status }: any) => authFetch(`/api/crm/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm"] }); if (selected) setSelected((p: any) => ({ ...p, status: arguments[0] })); } });
  const deleteLead = useMutation({ mutationFn: (id: number) => authFetch(`/api/crm/leads/${id}`, { method: "DELETE" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm"] }); setSelected(null); toast({ title: "Lead removido" }); } });

  const grouped = STATUSES.reduce((acc: any, s) => { acc[s] = leads.filter((l: any) => l.status === s); return acc; }, {});
  const totalValue = leads.reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0);
  const wonValue = leads.filter((l: any) => l.status === "ganho").reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0);

  if (selected) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setSelected(null)} className="text-muted-foreground">← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{selected.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{selected.company} · {selected.position}</p>
              </div>
              <Badge className={`border ${STATUS_CONFIG[selected.status]?.color}`}>{STATUS_CONFIG[selected.status]?.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {selected.email && <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.email}</p></div>}
              {selected.phone && <div><p className="text-xs text-muted-foreground">Telefone</p><p>{selected.phone}</p></div>}
              {selected.estimatedValue && <div><p className="text-xs text-muted-foreground">Valor Estimado</p><p className="text-green-400 font-semibold">R$ {Number(selected.estimatedValue).toLocaleString("pt-BR")}</p></div>}
              <div><p className="text-xs text-muted-foreground">Origem</p><p className="capitalize">{selected.source}</p></div>
            </div>
            {selected.notes && <div><p className="text-xs text-muted-foreground mb-1">Notas</p><p className="text-sm bg-muted/30 rounded p-2">{selected.notes}</p></div>}
            <div className="space-y-2">
              <p className="text-sm font-medium">Mover para:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <Button key={s} size="sm" variant="outline" onClick={() => { updateStatus.mutate({ id: selected.id, status: s }); setSelected((p: any) => ({ ...p, status: s })); }}>
                    {STATUS_CONFIG[s].label}
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => deleteLead.mutate(selected.id)}>Excluir Lead</Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="font-semibold">Atividades ({activities.length})</h3>
          {activities.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma atividade registrada.</p>
          : activities.map((a: any) => (
            <Card key={a.id}><CardContent className="pt-3 pb-3"><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.type} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}</p></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">🎯 CRM de Leads</h1>
          <p className="text-muted-foreground mt-1">Pipeline de novos clientes Nexora</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>+ Novo Lead</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Pipeline</p><p className="text-2xl font-bold">R$ {(totalValue / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Ganho</p><p className="text-2xl font-bold text-green-400">R$ {(wonValue / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Leads Ativos</p><p className="text-2xl font-bold">{leads.filter((l: any) => !["ganho","perdido"].includes(l.status)).length}</p></CardContent></Card>
      </div>

      {showNew && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle>Novo Lead</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Empresa" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              <Input placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <Input placeholder="Cargo" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
              <Input placeholder="Valor Estimado (R$)" type="number" value={form.estimatedValue} onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))} />
            </div>
            <Input placeholder="Notas" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex gap-2">
              <Button onClick={() => createLead.mutate({ ...form, estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined })} disabled={!form.name || createLead.isPending}>
                {createLead.isPending ? "Criando..." : "Criar Lead"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todos</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}</SelectContent>
      </Select>

      {isLoading ? <div className="animate-pulse text-muted-foreground">Carregando leads...</div> : (
        filterStatus !== "todos" ? (
          <div className="space-y-2">
            {leads.map((lead: any) => (
              <Card key={lead.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(lead)}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.company}</p></div>
                  <div className="text-right">
                    {lead.estimatedValue && <p className="text-sm font-semibold text-green-400">R$ {Number(lead.estimatedValue).toLocaleString("pt-BR")}</p>}
                    <Badge className={`text-xs border ${STATUS_CONFIG[lead.status]?.color}`}>{STATUS_CONFIG[lead.status]?.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {leads.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum lead com este status.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUSES.map(status => (
              <div key={status} className="space-y-2">
                <div className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_CONFIG[status].color.split(" ").slice(0,2).join(" ")}`}>{STATUS_CONFIG[status].label} ({grouped[status]?.length || 0})</div>
                {(grouped[status] || []).map((lead: any) => (
                  <Card key={lead.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelected(lead)}>
                    <CardContent className="pt-2 pb-2 px-3">
                      <p className="text-xs font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                      {lead.estimatedValue && <p className="text-xs text-green-400">R$ {Number(lead.estimatedValue / 1000).toFixed(0)}k</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
