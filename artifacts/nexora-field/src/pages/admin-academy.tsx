import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Course { id: number; title: string; slug?: string; description: string; shortDescription?: string; specialty: string; category: string; level: string; duration: number; content: string; instructor?: string; tags?: string; published: boolean; status: string; enrollments: number; rating: number | null; pointsValue: number; isMandatory: boolean; videoUrl?: string; thumbnailUrl?: string; createdAt: string; }
interface Category { id: number; name: string; icon: string; color: string; description?: string; order: number; }
interface Module { id: number; courseId: number; title: string; description?: string; order: number; }
interface Lesson { id: number; moduleId: number; courseId: number; title: string; description?: string; type: string; duration: number; videoUrl?: string; content?: string; materialUrl?: string; order: number; }
interface QuizQuestion { id: number; lessonId: number; question: string; options: string; correctAnswer: string; points: number; timeLimitSeconds: number; order: number; }
interface Student { user_id: number; name: string; email: string; total_enrolled: number; total_completed: number; total_certs: number; last_activity: string; }
interface CertRow { id: number; hash: string; issued_at: string; course_title: string; level: string; user_name: string; email: string; }
interface CertTemplate { id: number; name: string; description?: string; backgroundUrl?: string; signatureUrl?: string; textTemplate?: string; validityDays?: number; isDefault: boolean; }
interface Stats { totalCourses: number; totalStudents: number; totalCertificates: number; topCourses: any[]; certsByMonth: any[]; coursesByCategory: any[]; }

/* ─── Shared components ──────────────────────────────────────────────── */
type TabId = "dashboard" | "cursos" | "categorias" | "modulos" | "aulas" | "alunos" | "certificados" | "configuracoes";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "cursos", label: "Cursos", icon: "📚" },
  { id: "categorias", label: "Categorias", icon: "🗂️" },
  { id: "modulos", label: "Módulos", icon: "📦" },
  { id: "aulas", label: "Aulas", icon: "🎬" },
  { id: "alunos", label: "Alunos", icon: "👥" },
  { id: "certificados", label: "Certificados", icon: "🏆" },
  { id: "configuracoes", label: "Configurações", icon: "⚙️" },
];

const LEVEL_COLORS: Record<string, string> = { iniciante: "bg-green-500/20 text-green-400", intermediario: "bg-yellow-500/20 text-yellow-400", avancado: "bg-orange-500/20 text-orange-400", especialista: "bg-purple-500/20 text-purple-400" };
const LESSON_TYPES = ["video", "pdf", "texto", "quiz", "link", "arquivo"];
const LESSON_TYPE_ICONS: Record<string, string> = { video: "🎬", pdf: "📄", texto: "📝", quiz: "❓", link: "🔗", arquivo: "📁" };
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];
const DEFAULT_CATS = ["Telecom", "Fibra Óptica", "Infraestrutura TI", "Redes", "CFTV", "Eletrônica", "Automação Industrial", "Energia Solar", "Cloud", "Datacenter", "Inteligência Artificial", "Gestão e Negócios", "Segurança do Trabalho", "Boas Práticas Nexora"];

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-4xl" : "max-w-2xl"} bg-card rounded-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text", placeholder = "", rows = 3 }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; rows?: number }) {
  if (type === "textarea") return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" />
    </div>
  );
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${color}`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════════════════════ */
function DashboardTab() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin", "academy", "stats"],
    queryFn: () => apiFetch(`${API}/admin/academy/stats`),
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin text-4xl">⚙️</div></div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📚" label="Cursos" value={stats.totalCourses} color="bg-blue-500/20" />
        <StatCard icon="👥" label="Alunos" value={stats.totalStudents} color="bg-green-500/20" />
        <StatCard icon="🏆" label="Certificados" value={stats.totalCertificates} color="bg-yellow-500/20" />
        <StatCard icon="📊" label="Categorias" value={stats.coursesByCategory.length} color="bg-purple-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Courses by category */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cursos por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.coursesByCategory.map(r => ({ name: r.category, value: Number(r.total) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${String(name).slice(0, 12)}: ${value}`} labelLine={false}>
                  {stats.coursesByCategory.map((_r, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Certs by month */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Certificados por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.certsByMonth.slice().reverse().map((r: any) => ({ mes: String(r.month).slice(5), total: Number(r.total) }))}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top courses */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">🔥 Cursos Mais Acessados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topCourses.slice(0, 8).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                <span className="text-muted-foreground text-sm font-mono w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category} · {Number(c.completions)} concluídos</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.is_mandatory && <Badge className="bg-red-500/20 text-red-400 text-xs">Obrigatório</Badge>}
                  <span className="text-xs text-muted-foreground">{c.enrollments} alunos</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COURSES TAB
══════════════════════════════════════════════════════════════════════ */
function CursosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const emptyForm = (): Partial<Course> => ({ title: "", description: "", specialty: "", category: "", level: "iniciante", duration: 4, content: "", published: true, status: "publicado", pointsValue: 50, isMandatory: false });
  const [form, setForm] = useState<Partial<Course>>(emptyForm());

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["admin", "academy", "courses-all"], queryFn: () => apiFetch(`${API}/academy/courses?all=true`).catch(() => apiFetch(`${API}/academy/courses`)) });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["academy", "categories"], queryFn: () => apiFetch(`${API}/academy/categories`) });

  const catNames = Array.from(new Set([...DEFAULT_CATS, ...categories.map((c: any) => c.category || c.name)]));
  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    const matchCat = !filterCat || c.category === filterCat;
    return matchQ && matchCat;
  });

  const save = useMutation({
    mutationFn: (f: Partial<Course>) => f.id ? apiFetch(`${API}/academy/courses/${f.id}`, { method: "PUT", body: JSON.stringify(f) }) : apiFetch(`${API}/academy/courses`, { method: "POST", body: JSON.stringify(f) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); qc.invalidateQueries({ queryKey: ["academy"] }); setModal(null); toast({ title: "✅ Curso salvo!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/academy/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); qc.invalidateQueries({ queryKey: ["academy"] }); toast({ title: "Curso removido." }); },
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/courses/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); qc.invalidateQueries({ queryKey: ["academy"] }); toast({ title: "✅ Curso duplicado!" }); },
  });
  const archive = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/courses/${id}/archive`, { method: "PUT" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy"] }); qc.invalidateQueries({ queryKey: ["academy"] }); toast({ title: "Curso arquivado." }); },
  });

  const openCreate = () => { setForm(emptyForm()); setEditing(null); setModal("create"); };
  const openEdit = (c: Course) => { setForm({ ...c }); setEditing(c); setModal("edit"); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input placeholder="🔍 Buscar cursos..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">Todas as categorias</option>
          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto">
          <Button onClick={openCreate}>+ Novo Curso</Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} curso(s)</div>

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{c.title}</span>
                {c.isMandatory && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Obrigatório</Badge>}
                <span className={`px-2 py-0.5 rounded-full text-xs ${LEVEL_COLORS[c.level] || "bg-muted text-muted-foreground"}`}>{c.level}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${c.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.status || (c.published ? "publicado" : "rascunho")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.category} · {c.duration}h · {c.enrollments} alunos · {c.pointsValue}pts</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>✏️</Button>
              <Button size="sm" variant="ghost" onClick={() => duplicate.mutate(c.id)} title="Duplicar">📋</Button>
              <Button size="sm" variant="ghost" onClick={() => archive.mutate(c.id)} title="Arquivar">📦</Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir curso?")) del.mutate(c.id); }} className="text-red-400 hover:text-red-300">🗑️</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum curso encontrado.</p>}
      </div>

      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Novo Curso" : "Editar Curso"} onClose={() => setModal(null)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><F label="Título" value={form.title ?? ""} onChange={v => setForm({ ...form, title: v })} /></div>
            <div className="col-span-2"><F label="Slug (URL)" value={form.slug ?? ""} onChange={v => setForm({ ...form, slug: v })} placeholder="ex: fibra-optica-basico" /></div>
            <div className="col-span-2"><F label="Descrição Curta" value={form.shortDescription ?? ""} onChange={v => setForm({ ...form, shortDescription: v })} type="textarea" rows={2} /></div>
            <div className="col-span-2"><F label="Descrição Completa" value={form.description ?? ""} onChange={v => setForm({ ...form, description: v })} type="textarea" rows={3} /></div>
            <div className="col-span-2"><F label="Conteúdo (ementa)" value={form.content ?? ""} onChange={v => setForm({ ...form, content: v })} type="textarea" rows={4} /></div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <select value={form.category ?? ""} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Selecionar --</option>
                {catNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <F label="Especialidade" value={form.specialty ?? ""} onChange={v => setForm({ ...form, specialty: v })} />
            <Select label="Nível" value={form.level ?? "iniciante"} onChange={v => setForm({ ...form, level: v })} options={[{ value: "iniciante", label: "Iniciante" }, { value: "intermediario", label: "Intermediário" }, { value: "avancado", label: "Avançado" }, { value: "especialista", label: "Especialista" }]} />
            <Select label="Status" value={form.status ?? "publicado"} onChange={v => setForm({ ...form, status: v, published: v === "publicado" })} options={[{ value: "publicado", label: "Publicado" }, { value: "rascunho", label: "Rascunho" }, { value: "arquivado", label: "Arquivado" }]} />
            <F label="Carga Horária (h)" value={String(form.duration ?? 4)} onChange={v => setForm({ ...form, duration: Number(v) })} type="number" />
            <F label="Pontos Academy" value={String(form.pointsValue ?? 50)} onChange={v => setForm({ ...form, pointsValue: Number(v) })} type="number" />
            <F label="Instrutor" value={form.instructor ?? ""} onChange={v => setForm({ ...form, instructor: v })} />
            <F label="Tags (separadas por vírgula)" value={form.tags ?? ""} onChange={v => setForm({ ...form, tags: v })} />
            <F label="URL Vídeo de Apresentação" value={form.videoUrl ?? ""} onChange={v => setForm({ ...form, videoUrl: v })} />
            <F label="URL Imagem de Capa" value={form.thumbnailUrl ?? ""} onChange={v => setForm({ ...form, thumbnailUrl: v })} />
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.isMandatory} onChange={e => setForm({ ...form, isMandatory: e.target.checked })} className="rounded" />
                Curso Obrigatório
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Salvando..." : "💾 Salvar"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CATEGORIES TAB
══════════════════════════════════════════════════════════════════════ */
function CategoriasTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Category>>({ name: "", icon: "📚", color: "#3b82f6", description: "", order: 0 });

  const { data: cats = [] } = useQuery<Category[]>({ queryKey: ["admin", "academy", "categories"], queryFn: () => apiFetch(`${API}/admin/academy/categories`) });

  const save = useMutation({
    mutationFn: (f: Partial<Category>) => f.id ? apiFetch(`${API}/admin/academy/categories/${f.id}`, { method: "PUT", body: JSON.stringify(f) }) : apiFetch(`${API}/admin/academy/categories`, { method: "POST", body: JSON.stringify(f) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "categories"] }); setModal(null); toast({ title: "✅ Categoria salva!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "categories"] }); toast({ title: "Categoria removida." }); },
  });

  const open = (c?: Category) => { setForm(c ? { ...c } : { name: "", icon: "📚", color: "#3b82f6", description: "", order: cats.length }); setModal(c ? "edit" : "create"); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cats.length} categoria(s) cadastrada(s)</p>
        <Button onClick={() => open()}>+ Nova Categoria</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: c.color + "33" }}>{c.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{c.name}</p>
              {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => open(c)}>✏️</Button>
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm("Excluir?")) del.mutate(c.id); }}>🗑️</Button>
            </div>
          </div>
        ))}
      </div>

      {DEFAULT_CATS.filter(d => !cats.find(c => c.name === d)).length > 0 && (
        <div className="border border-dashed border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3">Categorias padrão não cadastradas:</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATS.filter(d => !cats.find(c => c.name === d)).map(d => (
              <button key={d} onClick={() => { setForm({ name: d, icon: "📚", color: "#3b82f6", order: cats.length }); setModal("create"); }} className="px-3 py-1 bg-muted/30 rounded-lg text-xs hover:bg-primary/10 transition-colors">+ {d}</button>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Nova Categoria" : "Editar Categoria"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <F label="Nome" value={form.name ?? ""} onChange={v => setForm({ ...form, name: v })} />
            <div className="grid grid-cols-2 gap-4">
              <F label="Ícone (emoji)" value={form.icon ?? "📚"} onChange={v => setForm({ ...form, icon: v })} />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cor</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color ?? "#3b82f6"} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-9 rounded border border-border cursor-pointer" />
                  <Input value={form.color ?? ""} onChange={e => setForm({ ...form, color: e.target.value })} className="font-mono text-xs" />
                </div>
              </div>
            </div>
            <F label="Descrição" value={form.description ?? ""} onChange={v => setForm({ ...form, description: v })} type="textarea" rows={2} />
            <F label="Ordem" value={String(form.order ?? 0)} onChange={v => setForm({ ...form, order: Number(v) })} type="number" />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Salvando..." : "💾 Salvar"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MODULES TAB
══════════════════════════════════════════════════════════════════════ */
function ModulosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Module>>({ title: "", description: "", order: 0 });

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["admin", "academy", "courses-all"], queryFn: () => apiFetch(`${API}/academy/courses`) });
  const { data: modules = [] } = useQuery<Module[]>({ queryKey: ["admin", "academy", "modules", selectedCourse], queryFn: () => apiFetch(`${API}/admin/academy/modules${selectedCourse ? `?courseId=${selectedCourse}` : ""}`), enabled: true });

  const save = useMutation({
    mutationFn: (f: Partial<Module>) => {
      const payload = { ...f, courseId: selectedCourse };
      return f.id ? apiFetch(`${API}/admin/academy/modules/${f.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch(`${API}/admin/academy/modules`, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "modules"] }); setModal(null); toast({ title: "✅ Módulo salvo!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/modules/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "modules"] }); toast({ title: "Módulo removido." }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedCourse ?? ""} onChange={e => setSelectedCourse(e.target.value ? Number(e.target.value) : null)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs">
          <option value="">Todos os cursos</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Button onClick={() => { if (!selectedCourse) { toast({ title: "Selecione um curso antes." }); return; } setForm({ title: "", description: "", order: modules.length }); setModal("create"); }} disabled={!selectedCourse}>+ Novo Módulo</Button>
      </div>

      <div className="space-y-2">
        {modules.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <span className="text-muted-foreground text-sm w-8 text-center font-mono">#{m.order + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{m.title}</p>
              {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => { setForm({ ...m }); setModal("edit"); }}>✏️</Button>
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm("Excluir módulo?")) del.mutate(m.id); }}>🗑️</Button>
            </div>
          </div>
        ))}
        {modules.length === 0 && <p className="text-center text-muted-foreground py-8">{selectedCourse ? "Nenhum módulo neste curso. Crie o primeiro!" : "Selecione um curso para ver seus módulos."}</p>}
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Novo Módulo" : "Editar Módulo"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <F label="Título" value={form.title ?? ""} onChange={v => setForm({ ...form, title: v })} />
            <F label="Descrição" value={form.description ?? ""} onChange={v => setForm({ ...form, description: v })} type="textarea" rows={2} />
            <F label="Ordem" value={String(form.order ?? 0)} onChange={v => setForm({ ...form, order: Number(v) })} type="number" />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Salvando..." : "💾 Salvar"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LESSONS TAB
══════════════════════════════════════════════════════════════════════ */
function AulasTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "quiz" | null>(null);
  const [form, setForm] = useState<Partial<Lesson>>({ title: "", description: "", type: "video", duration: 30, order: 0 });
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [qForm, setQForm] = useState<Partial<QuizQuestion>>({ question: "", options: '["","","",""]', correctAnswer: "", points: 10, timeLimitSeconds: 60, order: 0 });

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["admin", "academy", "courses-all"], queryFn: () => apiFetch(`${API}/academy/courses`) });
  const { data: modules = [] } = useQuery<Module[]>({ queryKey: ["admin", "academy", "modules", selectedCourse], queryFn: () => apiFetch(`${API}/admin/academy/modules?courseId=${selectedCourse}`), enabled: !!selectedCourse });
  const { data: lessons = [] } = useQuery<Lesson[]>({ queryKey: ["admin", "academy", "lessons", selectedModule, selectedCourse], queryFn: () => apiFetch(`${API}/admin/academy/lessons${selectedModule ? `?moduleId=${selectedModule}` : selectedCourse ? `?courseId=${selectedCourse}` : ""}`), enabled: !!(selectedCourse || selectedModule) });
  const { data: questions = [] } = useQuery<QuizQuestion[]>({ queryKey: ["admin", "academy", "questions", quizLesson?.id], queryFn: () => apiFetch(`${API}/admin/academy/questions?lessonId=${quizLesson?.id}`), enabled: !!quizLesson });

  const saveLesson = useMutation({
    mutationFn: (f: Partial<Lesson>) => {
      const payload = { ...f, moduleId: selectedModule, courseId: selectedCourse };
      return f.id ? apiFetch(`${API}/admin/academy/lessons/${f.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch(`${API}/admin/academy/lessons`, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "lessons"] }); setModal(null); toast({ title: "✅ Aula salva!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const delLesson = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "lessons"] }); toast({ title: "Aula removida." }); },
  });
  const saveQ = useMutation({
    mutationFn: (f: Partial<QuizQuestion>) => {
      const payload = { ...f, lessonId: quizLesson?.id };
      return f.id ? apiFetch(`${API}/admin/academy/questions/${f.id}`, { method: "PUT", body: JSON.stringify(payload) }) : apiFetch(`${API}/admin/academy/questions`, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "questions"] }); setQForm({ question: "", options: '["","","",""]', correctAnswer: "", points: 10, timeLimitSeconds: 60, order: questions.length }); toast({ title: "✅ Questão salva!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const delQ = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "questions"] }); toast({ title: "Questão removida." }); },
  });

  const optionsParsed = (() => { try { return JSON.parse(qForm.options ?? "[]"); } catch { return ["", "", "", ""]; } })();
  const setOption = (i: number, v: string) => { const a = [...optionsParsed]; a[i] = v; setQForm({ ...qForm, options: JSON.stringify(a) }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedCourse ?? ""} onChange={e => { setSelectedCourse(e.target.value ? Number(e.target.value) : null); setSelectedModule(null); }} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">Selecionar Curso</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selectedCourse && (
          <select value={selectedModule ?? ""} onChange={e => setSelectedModule(e.target.value ? Number(e.target.value) : null)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos os módulos</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        )}
        <Button onClick={() => { if (!selectedCourse) { toast({ title: "Selecione um curso." }); return; } setForm({ title: "", description: "", type: "video", duration: 30, order: lessons.length }); setModal("create"); }} disabled={!selectedCourse}>+ Nova Aula</Button>
      </div>

      <div className="space-y-2">
        {lessons.map(l => (
          <div key={l.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <span className="text-2xl">{LESSON_TYPE_ICONS[l.type] || "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.type} · {l.duration}min</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {l.type === "quiz" && (
                <Button size="sm" variant="ghost" onClick={() => { setQuizLesson(l); setModal("quiz"); }} title="Gerenciar Questões">❓</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setForm({ ...l }); setModal("edit"); }}>✏️</Button>
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm("Excluir aula?")) delLesson.mutate(l.id); }}>🗑️</Button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && <p className="text-center text-muted-foreground py-8">{selectedCourse ? "Nenhuma aula. Crie a primeira!" : "Selecione um curso para ver suas aulas."}</p>}
      </div>

      {/* Lesson form modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nova Aula" : "Editar Aula"} onClose={() => setModal(null)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><F label="Título" value={form.title ?? ""} onChange={v => setForm({ ...form, title: v })} /></div>
            <div className="col-span-2"><F label="Descrição" value={form.description ?? ""} onChange={v => setForm({ ...form, description: v })} type="textarea" rows={2} /></div>
            <Select label="Tipo" value={form.type ?? "video"} onChange={v => setForm({ ...form, type: v })} options={LESSON_TYPES.map(t => ({ value: t, label: `${LESSON_TYPE_ICONS[t]} ${t}` }))} />
            <F label="Duração (minutos)" value={String(form.duration ?? 30)} onChange={v => setForm({ ...form, duration: Number(v) })} type="number" />
            {(form.type === "video" || form.type === "link") && <div className="col-span-2"><F label="URL do Vídeo/Link" value={form.videoUrl ?? ""} onChange={v => setForm({ ...form, videoUrl: v })} /></div>}
            {form.type === "pdf" && <div className="col-span-2"><F label="URL do PDF" value={form.materialUrl ?? ""} onChange={v => setForm({ ...form, materialUrl: v })} /></div>}
            {(form.type === "texto" || form.type === "quiz") && <div className="col-span-2"><F label="Conteúdo / Instrução" value={form.content ?? ""} onChange={v => setForm({ ...form, content: v })} type="textarea" rows={5} /></div>}
            <F label="Material Complementar (URL)" value={form.materialUrl ?? ""} onChange={v => setForm({ ...form, materialUrl: v })} />
            <F label="Ordem" value={String(form.order ?? 0)} onChange={v => setForm({ ...form, order: Number(v) })} type="number" />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={() => saveLesson.mutate(form)} disabled={saveLesson.isPending}>{saveLesson.isPending ? "Salvando..." : "💾 Salvar"}</Button>
          </div>
        </Modal>
      )}

      {/* Quiz questions modal */}
      {modal === "quiz" && quizLesson && (
        <Modal title={`Questões — ${quizLesson.title}`} onClose={() => { setModal(null); setQuizLesson(null); }} wide>
          <div className="space-y-4">
            {/* Existing questions */}
            {questions.map((q, i) => {
              const opts = (() => { try { return JSON.parse(q.options); } catch { return []; } })();
              return (
                <div key={q.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                    <Button size="sm" variant="ghost" className="text-red-400 shrink-0" onClick={() => { if (confirm("Excluir?")) delQ.mutate(q.id); }}>🗑️</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {opts.map((o: string, oi: number) => (
                      <p key={oi} className={`text-xs px-2 py-1 rounded ${o === q.correctAnswer ? "bg-green-500/20 text-green-400" : "bg-muted/30 text-muted-foreground"}`}>{o === q.correctAnswer ? "✓ " : ""}{o}</p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{q.points} pts · {q.timeLimitSeconds}s</p>
                </div>
              );
            })}

            {/* Add new question */}
            <div className="border border-dashed border-primary/40 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-primary">+ Nova Questão</p>
              <F label="Pergunta" value={qForm.question ?? ""} onChange={v => setQForm({ ...qForm, question: v })} type="textarea" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                {optionsParsed.map((o: string, i: number) => (
                  <F key={i} label={`Alternativa ${String.fromCharCode(65 + i)}`} value={o} onChange={v => setOption(i, v)} />
                ))}
              </div>
              <F label="Resposta Correta (texto exato)" value={qForm.correctAnswer ?? ""} onChange={v => setQForm({ ...qForm, correctAnswer: v })} />
              <div className="grid grid-cols-2 gap-2">
                <F label="Pontos" value={String(qForm.points ?? 10)} onChange={v => setQForm({ ...qForm, points: Number(v) })} type="number" />
                <F label="Tempo (segundos)" value={String(qForm.timeLimitSeconds ?? 60)} onChange={v => setQForm({ ...qForm, timeLimitSeconds: Number(v) })} type="number" />
              </div>
              <Button onClick={() => saveQ.mutate({ ...qForm, order: questions.length })} disabled={saveQ.isPending} className="w-full">{saveQ.isPending ? "Salvando..." : "➕ Adicionar Questão"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STUDENTS TAB
══════════════════════════════════════════════════════════════════════ */
function AlunosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Student | null>(null);
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["admin", "academy", "students"], queryFn: () => apiFetch(`${API}/admin/academy/students`) });
  const { data: studentDetail } = useQuery<{ enrollments: any[]; certificates: any[] }>({ queryKey: ["admin", "academy", "student", detail?.user_id], queryFn: () => apiFetch(`${API}/admin/academy/students/${detail?.user_id}`), enabled: !!detail });

  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="🔍 Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-xs text-muted-foreground ml-auto">{students.length} aluno(s) com matrícula</span>
      </div>

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 cursor-pointer transition-all" onClick={() => setDetail(s)}>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{s.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-sm">
              <div className="text-center hidden sm:block"><p className="font-semibold">{s.total_enrolled}</p><p className="text-xs text-muted-foreground">Matriculados</p></div>
              <div className="text-center hidden sm:block"><p className="font-semibold text-green-400">{s.total_completed}</p><p className="text-xs text-muted-foreground">Concluídos</p></div>
              <div className="text-center hidden sm:block"><p className="font-semibold text-yellow-400">{s.total_certs}</p><p className="text-xs text-muted-foreground">Certs</p></div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum aluno encontrado.</p>}
      </div>

      {detail && (
        <Modal title={`Detalhe — ${detail.name}`} onClose={() => setDetail(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="📚" label="Matriculados" value={detail.total_enrolled} color="bg-blue-500/20" />
              <StatCard icon="✅" label="Concluídos" value={detail.total_completed} color="bg-green-500/20" />
              <StatCard icon="🏆" label="Certificados" value={detail.total_certs} color="bg-yellow-500/20" />
            </div>
            {studentDetail && (
              <>
                <p className="text-sm font-medium">Matrículas</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {studentDetail.enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-sm">
                      <span className="flex-1">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{e.progress}%</span>
                      {e.completed_at && <Badge className="bg-green-500/20 text-green-400 text-xs">Concluído</Badge>}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium">Certificados</p>
                <div className="space-y-1">
                  {studentDetail.certificates.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 text-sm">
                      <span className="text-yellow-400">🏆</span>
                      <span className="flex-1">{c.title}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.hash?.slice(0, 8)}…</span>
                    </div>
                  ))}
                  {studentDetail.certificates.length === 0 && <p className="text-xs text-muted-foreground">Nenhum certificado emitido.</p>}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CERTIFICATES TAB
══════════════════════════════════════════════════════════════════════ */
function CertificadosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab2, setTab2] = useState<"issued" | "templates">("issued");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<CertTemplate>>({ name: "", description: "", textTemplate: "", validityDays: undefined, isDefault: false });
  const [search, setSearch] = useState("");

  const { data: certs = [] } = useQuery<CertRow[]>({ queryKey: ["admin", "academy", "all-certificates"], queryFn: () => apiFetch(`${API}/admin/academy/all-certificates`) });
  const { data: templates = [] } = useQuery<CertTemplate[]>({ queryKey: ["admin", "academy", "cert-templates"], queryFn: () => apiFetch(`${API}/admin/academy/cert-templates`) });

  const save = useMutation({
    mutationFn: (f: Partial<CertTemplate>) => f.id ? apiFetch(`${API}/admin/academy/cert-templates/${f.id}`, { method: "PUT", body: JSON.stringify(f) }) : apiFetch(`${API}/admin/academy/cert-templates`, { method: "POST", body: JSON.stringify(f) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "cert-templates"] }); setModal(false); toast({ title: "✅ Template salvo!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`${API}/admin/academy/cert-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "academy", "cert-templates"] }); toast({ title: "Template removido." }); },
  });

  const filteredCerts = certs.filter(c => !search || c.user_name.toLowerCase().includes(search.toLowerCase()) || c.course_title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-2">
        {[{ id: "issued", label: "🏆 Emitidos" }, { id: "templates", label: "📄 Templates" }].map(t => (
          <button key={t.id} onClick={() => setTab2(t.id as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab2 === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {tab2 === "issued" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <span className="text-xs text-muted-foreground ml-auto">{filteredCerts.length} certificado(s)</span>
          </div>
          <div className="space-y-2">
            {filteredCerts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <span className="text-2xl">🏆</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.course_title}</p>
                  <p className="text-xs text-muted-foreground">{c.user_name} · {c.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">{c.hash?.slice(0, 12)}…</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.issued_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
            {filteredCerts.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum certificado emitido.</p>}
          </div>
        </div>
      )}

      {tab2 === "templates" && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button onClick={() => { setForm({ name: "", description: "", textTemplate: "", isDefault: false }); setModal(true); }}>+ Novo Template</Button></div>
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <span className="text-2xl">📜</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.isDefault && <Badge className="bg-primary/20 text-primary text-xs">Padrão</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setForm({ ...t }); setModal(true); }}>✏️</Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm("Excluir?")) del.mutate(t.id); }}>🗑️</Button>
                </div>
              </div>
            ))}
            {templates.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum template criado.</p>}
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Template de Certificado" onClose={() => setModal(false)} wide>
          <div className="space-y-4">
            <F label="Nome do Template" value={form.name ?? ""} onChange={v => setForm({ ...form, name: v })} />
            <F label="Descrição" value={form.description ?? ""} onChange={v => setForm({ ...form, description: v })} type="textarea" rows={2} />
            <F label="Validade (dias, deixe vazio para vitalício)" value={String(form.validityDays ?? "")} onChange={v => setForm({ ...form, validityDays: v ? Number(v) : undefined })} type="number" />
            <F label="URL Imagem de Fundo" value={form.backgroundUrl ?? ""} onChange={v => setForm({ ...form, backgroundUrl: v })} />
            <F label="URL Assinatura" value={form.signatureUrl ?? ""} onChange={v => setForm({ ...form, signatureUrl: v })} />
            <F label="Texto do Certificado (use {{nome}}, {{curso}}, {{data}})" value={form.textTemplate ?? ""} onChange={v => setForm({ ...form, textTemplate: v })} type="textarea" rows={5} placeholder="Certificamos que {{nome}} concluiu com êxito o curso {{curso}} em {{data}}." />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
              Template Padrão
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Salvando..." : "💾 Salvar"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════════════════════════════════════ */
function ConfiguracoesTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState({ pontosConcluidoBasico: 50, pontosConcluidoAvancado: 100, pontosObrigatorio: 300, pontosCertificacao: 200, notaMinima: 70, validadeCertDias: "", textoCert: "Certificamos que {{nome}} concluiu com êxito o curso {{curso}} na plataforma Nexora Field AI em {{data}}.", regrasHomologacao: "O técnico deve concluir todos os cursos obrigatórios para receber o selo de Técnico Homologado Nexora." });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">🎯 Pontuação Academy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="Pontos — Curso Concluído (básico)" value={String(config.pontosConcluidoBasico)} onChange={v => setConfig({ ...config, pontosConcluidoBasico: Number(v) })} type="number" />
            <F label="Pontos — Curso Avançado" value={String(config.pontosConcluidoAvancado)} onChange={v => setConfig({ ...config, pontosConcluidoAvancado: Number(v) })} type="number" />
            <F label="Pontos — Curso Obrigatório" value={String(config.pontosObrigatorio)} onChange={v => setConfig({ ...config, pontosObrigatorio: Number(v) })} type="number" />
            <F label="Pontos — Certificação Aprovada" value={String(config.pontosCertificacao)} onChange={v => setConfig({ ...config, pontosCertificacao: Number(v) })} type="number" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">📋 Regras de Conclusão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="Nota Mínima para Aprovação (%)" value={String(config.notaMinima)} onChange={v => setConfig({ ...config, notaMinima: Number(v) })} type="number" />
            <F label="Validade dos Certificados (dias, vazio = vitalício)" value={config.validadeCertDias} onChange={v => setConfig({ ...config, validadeCertDias: v })} type="number" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">🏆 Texto Padrão dos Certificados</CardTitle></CardHeader>
        <CardContent>
          <F label="Template (use {{nome}}, {{curso}}, {{data}})" value={config.textoCert} onChange={v => setConfig({ ...config, textoCert: v })} type="textarea" rows={4} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">✅ Regras de Homologação</CardTitle></CardHeader>
        <CardContent>
          <F label="Requisitos para Técnico Homologado Nexora" value={config.regrasHomologacao} onChange={v => setConfig({ ...config, regrasHomologacao: v })} type="textarea" rows={4} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast({ title: "✅ Configurações salvas!" })}>💾 Salvar Configurações</Button>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground"><strong className="text-blue-400">ℹ️ Filtros para Empresas</strong> — Empresas podem filtrar técnicos por: Curso Concluído · Curso Obrigatório Concluído · Certificado Emitido · Pontuação Academy · Técnico Homologado Nexora.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function AdminAcademy() {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎓 Nexora Academy — Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie cursos, módulos, aulas, alunos e certificados sem precisar de código.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all border-b-2 ${tab === t.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "cursos" && <CursosTab />}
        {tab === "categorias" && <CategoriasTab />}
        {tab === "modulos" && <ModulosTab />}
        {tab === "aulas" && <AulasTab />}
        {tab === "alunos" && <AlunosTab />}
        {tab === "certificados" && <CertificadosTab />}
        {tab === "configuracoes" && <ConfiguracoesTab />}
      </div>
    </div>
  );
}
