import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const ROLE_LABELS: Record<string, string> = {
  admin_master: "Admin Master",
  admin: "Admin",
  company: "Empresa",
  technician: "Técnico",
};
const ROLE_COLORS: Record<string, string> = {
  admin_master: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  company: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  technician: "bg-green-500/20 text-green-400 border-green-500/30",
};

function authHeader() {
  const token = localStorage.getItem("nexora_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

type ModalMode = "create" | "edit" | null;

export default function AdminAdministradores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });

  const isAdminMaster = user?.role === "admin_master";

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users", roleFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      const res = await fetch(`${API}/admin/users?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      return res.json();
    },
    staleTime: 10000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setModal(null);
      setForm({ name: "", email: "", password: "", role: "admin" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdminUser & { resetPassword?: string }> }) => {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado!" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setModal(null);
      setEditing(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário desativado." });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "admin" });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setModal("edit");
  };

  const handleSubmit = () => {
    if (modal === "create") {
      if (!form.name || !form.email || !form.password) {
        toast({ title: "Preencha todos os campos", variant: "destructive" }); return;
      }
      createMutation.mutate(form);
    } else if (modal === "edit" && editing) {
      const data: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) data.resetPassword = form.password;
      updateMutation.mutate({ id: editing.id, data });
    }
  };

  const adminUsers = users.filter(u => u.role === "admin_master" || u.role === "admin");
  const otherUsers = users.filter(u => u.role !== "admin_master" && u.role !== "admin");
  const displayUsers = (roleFilter === "admin" || roleFilter === "admin_master" || !roleFilter) ? users : users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Administradores</h1>
          <p className="text-muted-foreground mt-1">Crie, edite e gerencie administradores da plataforma</p>
        </div>
        {isAdminMaster && (
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            + Novo Usuário
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {["", "admin_master", "admin", "company", "technician"].map(r => (
            <Button
              key={r}
              variant={roleFilter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(r)}
            >
              {r === "" ? "Todos" : ROLE_LABELS[r]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Carregando usuários...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</td></tr>
                  )}
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {u.name[0]}
                          </div>
                          {u.name}
                          {u.mustChangePassword && <span title="Deve trocar senha" className="text-yellow-400 text-xs">⚠️</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[u.role] || "bg-muted text-muted-foreground border-border"}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {u.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(u)} className="h-7 text-xs px-2">
                            Editar
                          </Button>
                          {isAdminMaster && u.isActive && u.id !== user?.id && u.role !== "admin_master" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deactivateMutation.mutate(u.id)}
                              disabled={deactivateMutation.isPending}
                              className="h-7 text-xs px-2 text-red-400 hover:text-red-300 border-red-500/30"
                            >
                              Desativar
                            </Button>
                          )}
                          {!u.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMutation.mutate({ id: u.id, data: { isActive: true } })}
                              className="h-7 text-xs px-2 text-green-400 border-green-500/30"
                            >
                              Reativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <Card key={role} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setRoleFilter(role)}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{modal === "create" ? "Novo Usuário" : "Editar Usuário"}</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">E-mail</label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" type="email" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {modal === "edit" ? "Nova Senha (deixe em branco para não alterar)" : "Senha Temporária"}
                </label>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" type="password" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Perfil</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {isAdminMaster && <option value="admin_master">Admin Master</option>}
                  <option value="admin">Admin</option>
                  <option value="company">Empresa</option>
                  <option value="technician">Técnico</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setModal(null)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {modal === "create" ? "Criar" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
