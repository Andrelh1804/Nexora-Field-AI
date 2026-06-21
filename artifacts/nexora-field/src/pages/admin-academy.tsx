import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
function authH(): Record<string, string> {
  const t = localStorage.getItem("nexora_token");
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

const apiFetch = async (url: string, opts: RequestInit = {}) => {
  const r = await fetch(url, { ...opts, headers: { ...authH(), ...(opts.headers as Record<string, string> || {}) } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

interface Course {
  id: number;
  title: string;
  description: string;
  specialty: string;
  category: string;
  level: "iniciante" | "intermediario" | "avancado" | "especialista";
  duration: number;
  content: string;
  published: boolean;
  enrollments: number;
  rating: number | null;
  pointsValue: number;
  isMandatory: boolean;
  createdAt: string;
}

interface CategoryInfo {
  category: string;
  total: number | string;
  mandatory_count: number | string;
}

const LEVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};
const LEVEL_COLORS: Record<string, string> = {
  iniciante: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediario: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avancado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  especialista: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};
const CATEGORY_ICONS: Record<string, string> = {
  "Telecom e Fibra Óptica": "📡",
  "Redes e Infraestrutura TI": "🔗",
  "CFTV e Segurança Eletrônica": "📹",
  "Eletrônica": "🔌",
  "Automação Industrial": "⚙️",
  "Energia Solar": "☀️",
  "Certificações Profissionais": "🏆",
  "Inteligência Artificial": "🤖",
  "Gestão e Empreendedorismo": "💼",
  "Manual Nexora Field AI": "📋",
};

const EMPTY_FORM = (): Partial<Course> => ({
  title: "",
  description: "",
  specialty: "",
  category: "",
  level: "iniciante",
  duration: 4,
  content: "",
  published: true,
  pointsValue: 50,
  isMandatory: false,
});

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function CourseForm({
  form,
  onChange,
  onSubmit,
  loading,
  submitLabel,
  categories,
}: {
  form: Partial<Course>;
  onChange: (f: Partial<Course>) => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
  categories: string[];
}) {
  const field = (key: keyof Course, label: string, type = "text", opts?: string[]) => (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {opts ? (
        <select
          value={String(form[key] ?? "")}
          onChange={e => onChange({ ...form, [key]: e.target.value })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
        >
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={String(form[key] ?? "")}
          onChange={e => onChange({ ...form, [key]: e.target.value })}
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
        />
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          checked={Boolean(form[key])}
          onChange={e => onChange({ ...form, [key]: e.target.checked })}
          className="mt-1"
        />
      ) : (
        <Input
          type={type}
          value={String(form[key] ?? "")}
          onChange={e => onChange({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">{field("title", "Título")}</div>
        <div className="col-span-2">{field("description", "Descrição", "textarea")}</div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Categoria</label>
          <div className="mt-1 flex gap-2">
            <select
              value={form.category ?? ""}
              onChange={e => onChange({ ...form, category: e.target.value })}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Selecionar --</option>
              {categories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c] || "📚"} {c}</option>)}
              <option value="_nova">+ Nova categoria...</option>
            </select>
          </div>
          {form.category === "_nova" && (
            <Input className="mt-2" placeholder="Nome da nova categoria" onChange={e => onChange({ ...form, category: e.target.value })} />
          )}
        </div>
        <div>{field("specialty", "Especialidade")}</div>
        <div>
          {field("level", "Nível", "text", ["iniciante", "intermediario", "avancado", "especialista"])}
        </div>
        <div>{field("duration", "Duração (horas)", "number")}</div>
        <div>{field("pointsValue", "Pontos", "number")}</div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Status</label>
          <select
            value={form.published ? "true" : "false"}
            onChange={e => onChange({ ...form, published: e.target.value === "true" })}
            className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="true">Publicado</option>
            <option value="false">Rascunho</option>
          </select>
        </div>
        <div className="flex items-start gap-2 pt-6">
          <input
            type="checkbox"
            id="mandatory"
            checked={Boolean(form.isMandatory)}
            onChange={e => onChange({ ...form, isMandatory: e.target.checked })}
            className="mt-0.5"
          />
          <label htmlFor="mandatory" className="text-sm">Curso obrigatório (Homologação)</label>
        </div>
        <div className="col-span-2">{field("content", "Conteúdo / Ementa", "textarea")}</div>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={loading}>
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
}

export default function AdminAcademy() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [modal, setModal] = useState<"create" | "edit" | "stats" | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<Course>>(EMPTY_FORM());
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["admin", "academy", "courses"],
    queryFn: () => apiFetch(`${API}/academy/courses`),
  });
  const { data: categories = [] } = useQuery<CategoryInfo[]>({
    queryKey: ["admin", "academy", "categories"],
    queryFn: () => fetch(`${API}/academy/categories`).then(r => r.json()),
  });

  const categoryNames = categories.map(c => c.category);
  const allCats = ["Todos", ...categoryNames];

  const create = useMutation({
    mutationFn: (data: Partial<Course>) => apiFetch(`${API}/academy/courses`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); setModal(null); toast({ title: "✅ Curso criado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: ({ id, ...data }: Partial<Course> & { id: number }) =>
      apiFetch(`${API}/academy/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); setModal(null); toast({ title: "✅ Curso atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/academy/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); setConfirmDelete(null); toast({ title: "🗑️ Curso excluído." }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const togglePublish = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      apiFetch(`${API}/academy/courses/${id}`, { method: "PUT", body: JSON.stringify({ published }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "academy"] }),
  });

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "Todos" || c.category === filterCat;
    return matchSearch && matchCat;
  });

  // Aggregate stats
  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments, 0);
  const published = courses.filter(c => c.published).length;
  const avgRating = courses.filter(c => c.rating).reduce((s, c, _, a) => s + (c.rating || 0) / a.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">🎓 Admin Academy</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de cursos, categorias e gamificação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal("stats")}>📊 Estatísticas</Button>
          <Button onClick={() => { setForm(EMPTY_FORM()); setModal("create"); }}>+ Novo Curso</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{courses.length}</p>
            <p className="text-xs text-muted-foreground">Total de cursos</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-400">{published}</p>
            <p className="text-xs text-muted-foreground">Publicados</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{totalEnrollments.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Matrículas totais</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            <p className="text-xs text-muted-foreground">Avaliação média</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setFilterCat(filterCat === cat.category ? "Todos" : cat.category)}
            className={`text-left p-3 rounded-xl border transition-all ${filterCat === cat.category ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/40"}`}
          >
            <p className="text-xl mb-1">{CATEGORY_ICONS[cat.category] || "📚"}</p>
            <p className="text-xs font-medium leading-tight">{cat.category}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cat.total} cursos</p>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar curso, categoria ou especialidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {allCats.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-2 py-1 rounded-lg text-xs border transition-all ${filterCat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {(search || filterCat !== "Todos") && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setFilterCat("Todos"); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Course table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Cursos ({filtered.length})</span>
            {!isLoading && filtered.length !== courses.length && (
              <span className="text-xs text-muted-foreground font-normal">Filtrando {filtered.length} de {courses.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(course => (
                <div
                  key={course.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${course.isMandatory ? "border-orange-500/30 bg-orange-500/5" : "border-border bg-card/50 hover:bg-card"}`}
                >
                  {/* Icon */}
                  <span className="text-xl shrink-0">{CATEGORY_ICONS[course.category] || "📚"}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{course.title}</p>
                      {course.isMandatory && <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0">Obrigatório</Badge>}
                      {!course.published && <Badge variant="outline" className="text-xs shrink-0">Rascunho</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{course.category}</span>
                      <span>•</span>
                      <span>{course.specialty}</span>
                      <span>•</span>
                      <span>⏱ {course.duration}h</span>
                      <span>•</span>
                      <span>👥 {course.enrollments} matrículas</span>
                      {course.rating && <><span>•</span><span>⭐ {Number(course.rating).toFixed(1)}</span></>}
                    </div>
                  </div>

                  {/* Level badge */}
                  <Badge className={`text-xs border shrink-0 hidden sm:inline-flex ${LEVEL_COLORS[course.level]}`}>
                    {LEVEL_LABELS[course.level]}
                  </Badge>

                  {/* Points */}
                  <span className="text-xs font-semibold text-yellow-400 shrink-0">+{course.pointsValue} pts</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublish.mutate({ id: course.id, published: !course.published })}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${course.published ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted/50"}`}
                      title={course.published ? "Despublicar" : "Publicar"}
                    >
                      {course.published ? "🟢" : "⚪"}
                    </button>
                    <button
                      onClick={() => { setEditing(course); setForm({ ...course }); setModal("edit"); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDelete(course)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum curso encontrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create modal */}
      {modal === "create" && (
        <Modal title="Novo Curso" onClose={() => setModal(null)}>
          <CourseForm
            form={form}
            onChange={setForm}
            onSubmit={() => create.mutate(form)}
            loading={create.isPending}
            submitLabel="Criar Curso"
            categories={categoryNames}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {modal === "edit" && editing && (
        <Modal title={`Editar: ${editing.title}`} onClose={() => setModal(null)}>
          <CourseForm
            form={form}
            onChange={setForm}
            onSubmit={() => update.mutate({ ...form, id: editing.id } as Course)}
            loading={update.isPending}
            submitLabel="Salvar Alterações"
            categories={categoryNames}
          />
        </Modal>
      )}

      {/* Stats modal */}
      {modal === "stats" && (
        <Modal title="📊 Estatísticas da Academy" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xl font-bold">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">Cursos cadastrados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xl font-bold">{published}</p>
                  <p className="text-xs text-muted-foreground">Publicados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xl font-bold">{totalEnrollments.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">Matrículas totais</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xl font-bold">⭐ {avgRating > 0 ? avgRating.toFixed(2) : "—"}</p>
                  <p className="text-xs text-muted-foreground">Rating médio</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Por categoria</p>
              <div className="space-y-2">
                {categories.map(cat => {
                  const catCourses = courses.filter(c => c.category === cat.category);
                  const catEnrollments = catCourses.reduce((s, c) => s + c.enrollments, 0);
                  const pct = Math.round((catEnrollments / (totalEnrollments || 1)) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{CATEGORY_ICONS[cat.category] || "📚"} {cat.category}</span>
                        <span className="font-medium">{catEnrollments.toLocaleString("pt-BR")} matrículas ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Top 5 cursos por matrículas</p>
              <div className="space-y-1">
                {[...courses].sort((a, b) => b.enrollments - a.enrollments).slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-muted-foreground py-1 border-b border-border/50">
                    <span>{i + 1}. {c.title}</span>
                    <span className="font-semibold text-foreground">{c.enrollments} matrículas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <p className="text-3xl mb-2">⚠️</p>
              <p className="font-semibold">Excluir curso?</p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>"{confirmDelete.title}"</strong> será removido permanentemente.
                {confirmDelete.enrollments > 0 && (
                  <span className="block text-yellow-400 mt-1">Este curso tem {confirmDelete.enrollments} matrículas.</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1" onClick={() => remove.mutate(confirmDelete.id)} disabled={remove.isPending}>
                {remove.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
