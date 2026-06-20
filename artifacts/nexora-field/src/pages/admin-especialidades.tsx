import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronDown, ChevronRight, Eye, EyeOff, Layers } from "lucide-react";

interface Skill { id: number; name: string; active: boolean; subcategoryId: number; }
interface Subcategory { id: number; name: string; active: boolean; categoryId: number; skills: Skill[]; }
interface Category { id: number; name: string; icon: string; active: boolean; subcategories: Subcategory[]; }

type DialogType = "category" | "subcategory" | "skill" | null;

export default function AdminEspecialidades() {
  const { toast } = useToast();
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<DialogType>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fName, setFName] = useState("");
  const [fIcon, setFIcon] = useState("🔧");
  const [fCatId, setFCatId] = useState("");
  const [fSubId, setFSubId] = useState("");
  const [stats, setStats] = useState({ categories: 0, subcategories: 0, skills: 0 });

  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const token = getAuthToken();

  function load() {
    fetch(`${apiBase}/api/specialties`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Category[]) => {
        setTree(data);
        const cats = data.length;
        const subs = data.reduce((s, c) => s + c.subcategories.length, 0);
        const skills = data.reduce((s, c) => s + c.subcategories.reduce((ss, sub) => ss + sub.skills.length, 0), 0);
        setStats({ categories: cats, subcategories: subs, skills });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggleOpen(id: number) {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function createCategory() {
    if (!fName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/specialties/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: fName.trim(), icon: fIcon }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Categoria criada!" });
      setDialog(null); setFName(""); setFIcon("🔧");
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function createSubcategory() {
    if (!fName.trim() || !fCatId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/specialties/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: fName.trim(), categoryId: parseInt(fCatId) }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Subcategoria criada!" });
      setDialog(null); setFName(""); setFCatId("");
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function createSkill() {
    if (!fName.trim() || !fSubId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/specialties/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: fName.trim(), subcategoryId: parseInt(fSubId) }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Skill criada!" });
      setDialog(null); setFName(""); setFSubId("");
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function toggleSkillActive(skillId: number, active: boolean) {
    await fetch(`${apiBase}/api/admin/specialties/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function toggleCategoryActive(catId: number, active: boolean) {
    await fetch(`${apiBase}/api/admin/specialties/categories/${catId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  const allSubcategories = tree.flatMap(c => c.subcategories);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" />
            Gerenciar Especialidades
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Painel admin — categorias, subcategorias e skills
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setDialog("category"); setFName(""); setFIcon("🔧"); }}>
            <Plus className="h-4 w-4" /> Categoria
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setDialog("subcategory"); setFName(""); setFCatId(""); }}>
            <Plus className="h-4 w-4" /> Subcategoria
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setDialog("skill"); setFName(""); setFSubId(""); }}>
            <Plus className="h-4 w-4" /> Skill
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Categorias", value: stats.categories },
          { label: "Subcategorias", value: stats.subcategories },
          { label: "Skills", value: stats.skills },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tree */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hierarquia de Especialidades</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Carregando...</div>
          ) : (
            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-1">
                {tree.map(cat => (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 group">
                      <button onClick={() => toggleOpen(cat.id)} className="flex items-center gap-2 flex-1 text-left">
                        {open.has(cat.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-semibold">{cat.name}</span>
                        <Badge variant="outline" className="text-xs ml-1">
                          {cat.subcategories.reduce((s, sub) => s + sub.skills.length, 0)} skills
                        </Badge>
                        {!cat.active && <Badge variant="destructive" className="text-xs">inativo</Badge>}
                      </button>
                      <button
                        onClick={() => toggleCategoryActive(cat.id, cat.active)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        title={cat.active ? "Desativar" : "Ativar"}
                      >
                        {cat.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                    {open.has(cat.id) && (
                      <div className="ml-6 border-l border-border pl-3 space-y-0.5 mb-1">
                        {cat.subcategories.map(sub => (
                          <div key={sub.id}>
                            <div
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 cursor-pointer"
                              onClick={() => toggleOpen(sub.id)}
                            >
                              {open.has(sub.id) ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-xs font-medium text-muted-foreground flex-1">{sub.name}</span>
                              <span className="text-xs text-muted-foreground">{sub.skills.length} skills</span>
                            </div>
                            {open.has(sub.id) && (
                              <div className="ml-4 py-1 flex flex-wrap gap-1.5">
                                {sub.skills.map(skill => (
                                  <div key={skill.id} className="group/skill flex items-center gap-1">
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${!skill.active ? "opacity-40 line-through" : ""}`}
                                    >
                                      {skill.name}
                                    </Badge>
                                    <button
                                      onClick={() => toggleSkillActive(skill.id, skill.active)}
                                      className="opacity-0 group-hover/skill:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                    >
                                      {skill.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={dialog === "category"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Ícone (emoji)</Label>
              <Input value={fIcon} onChange={e => setFIcon(e.target.value)} placeholder="📡" className="text-2xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Telecom" onKeyDown={e => e.key === "Enter" && createCategory()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={createCategory} disabled={saving || !fName.trim()}>Criar Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subcategory Dialog */}
      <Dialog open={dialog === "subcategory"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Subcategoria</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={fCatId} onValueChange={setFCatId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {tree.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Fibra Óptica" onKeyDown={e => e.key === "Enter" && createSubcategory()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={createSubcategory} disabled={saving || !fName.trim() || !fCatId}>Criar Subcategoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Skill Dialog */}
      <Dialog open={dialog === "skill"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Skill</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Subcategoria</Label>
              <Select value={fSubId} onValueChange={setFSubId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {allSubcategories.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome da Skill</Label>
              <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Fusão de fibra" onKeyDown={e => e.key === "Enter" && createSkill()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={createSkill} disabled={saving || !fName.trim() || !fSubId}>Criar Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
