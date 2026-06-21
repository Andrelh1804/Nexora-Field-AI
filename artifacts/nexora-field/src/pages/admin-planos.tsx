import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function authHeader() {
  const token = localStorage.getItem("nexora_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  target: string;
  price: number;
  maxOrders: number | null;
  features: string[];
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const TARGET_LABELS: Record<string, string> = {
  technician: "Técnico",
  company: "Empresa",
  both: "Ambos",
};

const emptyForm = (): Partial<Plan> & { featuresText: string } => ({
  name: "",
  slug: "",
  description: "",
  target: "company",
  price: 0,
  maxOrders: null,
  features: [],
  featuresText: "",
  highlighted: false,
  active: true,
  sortOrder: 0,
});

export default function AdminPlanos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm());

  const isAdminMaster = user?.role === "admin_master";

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const res = await fetch(`${API}/admin/plans`, { headers: authHeader() });
      if (!res.ok) throw new Error("Erro ao buscar planos");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API}/admin/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano criado com sucesso!" });
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setModal(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`${API}/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano atualizado!" });
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setModal(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/admin/plans/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano removido." });
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      ...p,
      featuresText: p.features.join("\n"),
    });
    setModal("edit");
  };

  const handleSubmit = () => {
    const features = (form.featuresText || "").split("\n").map(s => s.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      slug: form.slug || (form.name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: form.description,
      target: form.target,
      price: Number(form.price) || 0,
      maxOrders: form.maxOrders ? Number(form.maxOrders) : null,
      features,
      highlighted: form.highlighted,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (!payload.name || !payload.target) {
      toast({ title: "Nome e segmento são obrigatórios", variant: "destructive" }); return;
    }
    if (modal === "create") createMutation.mutate(payload);
    else if (editing) updateMutation.mutate({ id: editing.id, data: payload });
  };

  const toggleActive = (p: Plan) => {
    updateMutation.mutate({ id: p.id, data: { active: !p.active } });
  };

  const toggleHighlight = (p: Plan) => {
    updateMutation.mutate({ id: p.id, data: { highlighted: !p.highlighted } });
  };

  const f = (v: any, k: string, isNum = false) =>
    setForm(prev => ({ ...prev, [k]: isNum ? v : v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Planos</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie os planos comerciais da plataforma</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-muted-foreground text-xs uppercase">Total</p><p className="text-2xl font-bold">{plans.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-muted-foreground text-xs uppercase">Ativos</p><p className="text-2xl font-bold text-green-400">{plans.filter(p => p.active).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-muted-foreground text-xs uppercase">Destacados</p><p className="text-2xl font-bold text-yellow-400">{plans.filter(p => p.highlighted).length}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Carregando planos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length === 0 && (
            <div className="col-span-3 text-center text-muted-foreground py-12">
              Nenhum plano cadastrado. Crie o primeiro plano!
            </div>
          )}
          {plans.map(p => (
            <Card key={p.id} className={`relative flex flex-col ${p.highlighted ? "border-yellow-500/50 bg-yellow-500/5" : ""} ${!p.active ? "opacity-60" : ""}`}>
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-0.5 rounded-full">
                  ⭐ Destaque
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p.slug}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {p.price === 0 ? "Grátis" : `R$ ${p.price.toFixed(2)}`}
                    {p.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                  </span>
                  <Badge variant="outline">{TARGET_LABELS[p.target] || p.target}</Badge>
                </div>
                {p.maxOrders && (
                  <p className="text-xs text-muted-foreground">Até {p.maxOrders} chamados/mês</p>
                )}
                {p.features.length > 0 && (
                  <ul className="space-y-1">
                    {p.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                    {p.features.length > 4 && <li className="text-xs text-muted-foreground">+{p.features.length - 4} mais...</li>}
                  </ul>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 h-7 text-xs">
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleHighlight(p)}
                    className={`h-7 text-xs ${p.highlighted ? "text-yellow-400 border-yellow-500/30" : ""}`}
                  >
                    {p.highlighted ? "★" : "☆"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(p)}
                    className={`h-7 text-xs ${p.active ? "text-red-400 border-red-500/30" : "text-green-400 border-green-500/30"}`}
                  >
                    {p.active ? "Desativar" : "Ativar"}
                  </Button>
                  {isAdminMaster && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="h-7 text-xs text-red-400 border-red-500/30 px-2"
                      title="Excluir plano"
                    >
                      🗑
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 my-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal === "create" ? "Novo Plano" : "Editar Plano"}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">Nome do Plano *</label>
                <Input value={form.name || ""} onChange={e => f(e.target.value, "name")} placeholder="Ex: Professional" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Slug (URL)</label>
                <Input
                  value={form.slug || ""}
                  onChange={e => f(e.target.value, "slug")}
                  placeholder="professional"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Segmento *</label>
                <select
                  value={form.target || "company"}
                  onChange={e => f(e.target.value, "target")}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                >
                  <option value="technician">Técnico</option>
                  <option value="company">Empresa</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                <Input value={form.description || ""} onChange={e => f(e.target.value, "description")} placeholder="Breve descrição do plano" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Preço (R$/mês)</label>
                <Input
                  type="number"
                  value={form.price ?? 0}
                  onChange={e => f(e.target.value, "price")}
                  placeholder="0"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Chamados/mês (0 = ilimitado)</label>
                <Input
                  type="number"
                  value={form.maxOrders ?? ""}
                  onChange={e => f(e.target.value || null, "maxOrders")}
                  placeholder="Ilimitado"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Ordem de exibição</label>
                <Input type="number" value={form.sortOrder ?? 0} onChange={e => f(Number(e.target.value), "sortOrder")} />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.highlighted ?? false}
                    onChange={e => f(e.target.checked, "highlighted")}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="text-sm">Destacar plano</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active ?? true}
                    onChange={e => f(e.target.checked, "active")}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">Ativo</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Funcionalidades (uma por linha)
                </label>
                <textarea
                  value={form.featuresText || ""}
                  onChange={e => setForm(prev => ({ ...prev, featuresText: e.target.value }))}
                  placeholder={"Até 10 chamados/mês\nSuporte via e-mail\nDashboard básico"}
                  rows={5}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setModal(null)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {modal === "create" ? "Criar Plano" : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
