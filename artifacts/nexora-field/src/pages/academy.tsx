import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API = "/api";
const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const LEVEL_COLORS: Record<string, string> = {
  iniciante: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediario: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avancado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  especialista: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};
const LEVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};
const POINTS_LABELS: Record<number, string> = {
  50: "🥉 +50 pts",
  100: "🥈 +100 pts",
  200: "🥇 +200 pts",
  300: "💎 +300 pts",
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

interface AcademyScore {
  totalScore: number;
  totalCompleted: number;
  mandatoryCompleted: number;
  isHomologado: boolean;
  mandatoryScore: number;
  optionalScore: number;
}

interface CategoryInfo {
  category: string;
  total: number;
  mandatory_count: number;
}

export default function Academy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"cursos" | "meus" | "certs">("cursos");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["academy", "courses"],
    queryFn: () => authFetch(`${API}/academy/courses`),
  });
  const { data: categories = [] } = useQuery<CategoryInfo[]>({
    queryKey: ["academy", "categories"],
    queryFn: () => fetch(`${API}/academy/categories`).then(r => r.json()),
  });
  const { data: myCourses = [] } = useQuery({
    queryKey: ["academy", "my"],
    queryFn: () => authFetch(`${API}/academy/my-courses`),
    enabled: !!user,
  });
  const { data: certs = [] } = useQuery({
    queryKey: ["academy", "certs"],
    queryFn: () => authFetch(`${API}/academy/certificates`),
    enabled: !!user,
  });
  const { data: myScore } = useQuery<AcademyScore>({
    queryKey: ["academy", "score"],
    queryFn: () => authFetch(`${API}/academy/my-score`),
    enabled: !!user && user.role === "technician",
  });

  const enroll = useMutation({
    mutationFn: (id: number) => authFetch(`${API}/academy/courses/${id}/enroll`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy"] });
      toast({ title: "✅ Matriculado!", description: "Boa sorte no curso." });
    },
  });
  const complete = useMutation({
    mutationFn: (id: number) => authFetch(`${API}/academy/courses/${id}/complete`, { method: "POST" }),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: ["academy"] });
      const course = courses.find((c: any) => c.id === courseId) as any;
      const pts = course?.pointsValue ?? 50;
      toast({ title: `🎓 Certificado emitido! +${pts} pts`, description: "Parabéns pela conclusão! Seu ranking foi atualizado." });
    },
  });

  const enrolledIds = new Set(myCourses.map((e: any) => e.enrollment?.courseId));
  const completedIds = new Set(myCourses.filter((e: any) => e.enrollment?.completedAt).map((e: any) => e.enrollment?.courseId));

  const allCategories = ["Todos", ...categories.map((c: CategoryInfo) => c.category)];

  const filteredCourses = courses.filter((c: any) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "Todos" || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  const mandatoryCourse = courses.find((c: any) => c.isMandatory);
  const isHomologado = myScore?.isHomologado || (mandatoryCourse && completedIds.has((mandatoryCourse as any).id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">🎓 Academy</h1>
          <p className="text-muted-foreground mt-1">Capacitação técnica para técnicos de campo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isHomologado && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1">
              ✅ Técnico Homologado Nexora
            </Badge>
          )}
          {certs.length > 0 && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              📜 {certs.length} certificado{certs.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Academy Score Card (technicians only) */}
      {user?.role === "technician" && myScore && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{myScore.totalScore}</p>
              <p className="text-xs text-muted-foreground">Pontos Academy</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-400">{myScore.totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Cursos concluídos</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{certs.length}</p>
              <p className="text-xs text-muted-foreground">Certificados</p>
            </CardContent>
          </Card>
          <Card className={`border-blue-500/20 ${isHomologado ? "bg-blue-500/10" : "bg-muted/10"}`}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl">{isHomologado ? "✅" : "🔒"}</p>
              <p className="text-xs text-muted-foreground">{isHomologado ? "Homologado" : "Homologação pendente"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gamification info */}
      {user?.role === "technician" && !myScore?.isHomologado && mandatoryCourse && !completedIds.has((mandatoryCourse as any).id) && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-orange-400 text-sm">Curso Obrigatório Pendente</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Complete o <strong>Manual de Boas Práticas Nexora Field AI</strong> para se tornar um Técnico Homologado e ganhar +300 pts no ranking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {(["cursos", "meus", "certs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "cursos" ? `Todos os Cursos (${courses.length})` : t === "meus" ? `Meus Cursos (${myCourses.length})` : `Certificados (${certs.length})`}
          </button>
        ))}
      </div>

      {/* Cursos Tab */}
      {tab === "cursos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Buscar cursos ou especialidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {cat !== "Todos" && <span>{CATEGORY_ICONS[cat] || "📚"}</span>}
                {cat === "Todos" ? "Todos" : cat}
                {cat !== "Todos" && (
                  <span className="ml-1 opacity-60">
                    ({categories.find((c: CategoryInfo) => c.category === cat)?.total || 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course: any) => {
                const isEnrolled = enrolledIds.has(course.id);
                const isDone = completedIds.has(course.id);
                return (
                  <Card key={course.id} className={`hover:border-primary/40 transition-all ${course.isMandatory ? "border-orange-500/40 bg-orange-500/5" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-base">{CATEGORY_ICONS[course.category] || "📚"}</span>
                            <span className="text-xs text-muted-foreground">{course.category}</span>
                            {course.isMandatory && (
                              <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30 ml-1">Obrigatório</Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm leading-tight">{course.title}</CardTitle>
                        </div>
                        <Badge className={`text-xs border shrink-0 ${LEVEL_COLORS[course.level]}`}>{LEVEL_LABELS[course.level]}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span>⏱ {course.duration}h</span>
                          <span>👥 {course.enrollments}</span>
                          {course.rating && <span>⭐ {Number(course.rating).toFixed(1)}</span>}
                        </div>
                        <span className="font-semibold text-yellow-400">{POINTS_LABELS[course.pointsValue] || `+${course.pointsValue} pts`}</span>
                      </div>
                      {user && (
                        isDone ? (
                          <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30">✅ Concluído</Badge>
                        ) : isEnrolled ? (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => complete.mutate(course.id)} disabled={complete.isPending}>
                            {complete.isPending ? "Emitindo..." : "Marcar como Concluído"}
                          </Button>
                        ) : (
                          <Button size="sm" className="w-full" onClick={() => enroll.mutate(course.id)} disabled={enroll.isPending}>
                            {enroll.isPending ? "Matriculando..." : `Matricular-se • ${POINTS_LABELS[course.pointsValue] || `+${course.pointsValue} pts`}`}
                          </Button>
                        )
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredCourses.length === 0 && (
                <p className="text-muted-foreground col-span-3 text-center py-8">Nenhum curso encontrado.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Meus Cursos Tab */}
      {tab === "meus" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCourses.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-muted-foreground">Você ainda não está matriculado em nenhum curso.</p>
              <Button className="mt-4" onClick={() => setTab("cursos")}>Ver cursos disponíveis</Button>
            </div>
          ) : myCourses.map((e: any) => (
            <Card key={e.enrollment?.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{e.course?.title}</p>
                    <p className="text-xs text-muted-foreground">{e.course?.category} • {e.course?.specialty}</p>
                  </div>
                  {e.enrollment?.completedAt ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">✅ Concluído</Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">Em progresso</Badge>
                  )}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${e.enrollment?.progress || 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{e.enrollment?.progress || 0}% concluído</p>
                  <span className="text-xs text-yellow-400 font-semibold">
                    {POINTS_LABELS[e.course?.pointsValue] || `+${e.course?.pointsValue || 50} pts`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Certificados Tab */}
      {tab === "certs" && (
        <div className="space-y-4">
          {myScore && myScore.totalScore > 0 && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pontuação Academy Total</p>
                    <p className="text-3xl font-bold text-yellow-400">{myScore.totalScore} pts</p>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>📋 Obrigatórios: <strong className="text-foreground">{myScore.mandatoryScore} pts</strong></span>
                    <span>📚 Opcionais: <strong className="text-foreground">{myScore.optionalScore} pts</strong></span>
                  </div>
                  {isHomologado && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1.5">
                      ✅ Técnico Homologado Nexora
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-4xl mb-3">🎓</p>
                <p className="text-muted-foreground">Nenhum certificado emitido ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">Conclua um curso para obter seu certificado.</p>
                <Button className="mt-4" onClick={() => setTab("cursos")}>Ver cursos</Button>
              </div>
            ) : certs.map((c: any) => (
              <Card key={c.cert?.id} className={`${c.course?.isMandatory ? "border-blue-500/30 bg-blue-500/5" : "border-purple-500/20 bg-purple-500/5"}`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.course?.isMandatory ? "🏅" : "📜"}</span>
                    <div>
                      <p className={`font-semibold text-sm ${c.course?.isMandatory ? "text-blue-300" : "text-purple-300"}`}>{c.course?.title}</p>
                      <p className="text-xs text-muted-foreground">{c.course?.category}</p>
                      <p className="text-xs text-muted-foreground">Emitido em {new Date(c.cert?.issuedAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="bg-muted/30 rounded-lg p-2 flex-1 mr-2">
                      <p className="text-xs text-muted-foreground font-mono break-all">{c.cert?.hash?.slice(0, 32)}...</p>
                    </div>
                    <span className="text-xs font-semibold text-yellow-400 shrink-0">
                      +{c.course?.pointsValue || 50} pts
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
