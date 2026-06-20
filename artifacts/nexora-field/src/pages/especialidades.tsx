import { useState, useEffect } from "react";
import { useAuth, getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpecialtySelector, type SelectedSkill } from "@/components/specialty-selector";
import { Sparkles, Save, Award, Zap } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};
const LEVEL_COLORS: Record<string, string> = {
  iniciante: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  intermediario: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avancado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  especialista: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Especialidades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!user) return;
    fetch(`${apiBase}/api/technicians/me/specialties`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
      .then((r) => r.json())
      .then((data: Array<{
        skillId: number; skillName: string; categoryName: string;
        categoryIcon: string; level: string; yearsExperience: number;
      }>) => {
        if (Array.isArray(data)) {
          setSkills(
            data.map((s) => ({
              skillId: s.skillId,
              skillName: s.skillName ?? "",
              categoryName: s.categoryName ?? "",
              categoryIcon: s.categoryIcon ?? "🔧",
              level: (s.level ?? "intermediario") as SelectedSkill["level"],
              yearsExperience: s.yearsExperience ?? 0,
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, apiBase]);

  function handleChange(updated: SelectedSkill[]) {
    setSkills(updated);
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/technicians/me/specialties`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          specialties: skills.map((s) => ({
            skillId: s.skillId,
            level: s.level,
            yearsExperience: s.yearsExperience,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      toast({ title: "Especialidades salvas!", description: `${skills.length} skills atualizadas com sucesso.` });
    } catch {
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // Group skills by category for the summary view
  const byCategory = skills.reduce<Record<string, SelectedSkill[]>>((acc, sk) => {
    const key = `${sk.categoryIcon} ${sk.categoryName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sk);
    return acc;
  }, {});

  const matchScore = Math.min(100, Math.round(
    skills.length * 4 +
    skills.filter(s => s.level === "avancado").length * 5 +
    skills.filter(s => s.level === "especialista").length * 8 +
    skills.reduce((s, sk) => s + sk.yearsExperience, 0) * 2
  ));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Minhas Especialidades
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suas skills alimentam o algoritmo de match inteligente
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="gap-2 min-w-[140px]"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : dirty ? "Salvar alterações" : "Salvo ✓"}
        </Button>
      </div>

      {/* Match Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-primary">{matchScore}</p>
              <p className="text-xs text-muted-foreground">Match Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{skills.length}</p>
              <p className="text-xs text-muted-foreground">Skills selecionadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">
                {skills.filter(s => s.level === "avancado" || s.level === "especialista").length}
              </p>
              <p className="text-xs text-muted-foreground">Nível avançado+</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecionar Especialidades</CardTitle>
          <CardDescription className="text-xs">
            Clique em um skill para selecionar. Clique no chip para ajustar nível e experiência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
              Carregando especialidades...
            </div>
          ) : (
            <SpecialtySelector value={skills} onChange={handleChange} />
          )}
        </CardContent>
      </Card>

      {/* Summary by category */}
      {Object.keys(byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, catSkills]) => (
                <div key={cat} className="space-y-1.5">
                  <p className="text-sm font-medium">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {catSkills.map((sk) => (
                      <Badge
                        key={sk.skillId}
                        variant="outline"
                        className={`text-xs border ${LEVEL_COLORS[sk.level] ?? ""}`}
                      >
                        {sk.skillName} · {LEVEL_LABELS[sk.level]}
                        {sk.yearsExperience > 0 && ` · ${sk.yearsExperience}a`}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {skills.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Selecione suas especialidades acima para aparecer nos matches das empresas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
