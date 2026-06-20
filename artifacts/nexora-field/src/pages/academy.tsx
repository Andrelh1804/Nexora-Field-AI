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

const LEVEL_COLORS: Record<string, string> = { iniciante: "bg-green-500/20 text-green-400 border-green-500/30", intermediario: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", avancado: "bg-orange-500/20 text-orange-400 border-orange-500/30", especialista: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
const LEVEL_LABELS: Record<string, string> = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado", especialista: "Especialista" };

export default function Academy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"cursos" | "meus" | "certs">("cursos");

  const { data: courses = [], isLoading } = useQuery({ queryKey: ["academy", "courses"], queryFn: () => authFetch(`${API}/academy/courses`) });
  const { data: myCourses = [] } = useQuery({ queryKey: ["academy", "my"], queryFn: () => authFetch(`${API}/academy/my-courses`), enabled: !!user });
  const { data: certs = [] } = useQuery({ queryKey: ["academy", "certs"], queryFn: () => authFetch(`${API}/academy/certificates`), enabled: !!user });

  const enroll = useMutation({ mutationFn: (id: number) => authFetch(`${API}/academy/courses/${id}/enroll`, { method: "POST" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["academy"] }); toast({ title: "Matriculado!", description: "Boa sorte no curso." }); } });
  const complete = useMutation({ mutationFn: (id: number) => authFetch(`${API}/academy/courses/${id}/complete`, { method: "POST" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["academy"] }); toast({ title: "🎓 Certificado emitido!", description: "Parabéns pela conclusão!" }); } });

  const filteredCourses = courses.filter((c: any) => c.title.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase()));
  const enrolledIds = new Set(myCourses.map((e: any) => e.enrollment?.courseId));
  const completedIds = new Set(myCourses.filter((e: any) => e.enrollment?.completedAt).map((e: any) => e.enrollment?.courseId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">🎓 Academy</h1>
          <p className="text-muted-foreground mt-1">Capacitação técnica para técnicos de campo</p>
        </div>
        {certs.length > 0 && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{certs.length} certificado{certs.length > 1 ? "s" : ""}</Badge>}
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["cursos", "meus", "certs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "cursos" ? "Todos os Cursos" : t === "meus" ? "Meus Cursos" : "Certificados"}
          </button>
        ))}
      </div>

      {tab === "cursos" && (
        <div className="space-y-4">
          <Input placeholder="Buscar cursos ou especialidade..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          {isLoading ? <div className="animate-pulse text-muted-foreground">Carregando cursos...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course: any) => {
                const isEnrolled = enrolledIds.has(course.id);
                const isDone = completedIds.has(course.id);
                return (
                  <Card key={course.id} className="hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                        <Badge className={`text-xs border ${LEVEL_COLORS[course.level]}`}>{LEVEL_LABELS[course.level]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{course.specialty}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>⏱ {course.duration}h</span>
                        <span>👥 {course.enrollments} alunos</span>
                        {course.rating && <span>⭐ {Number(course.rating).toFixed(1)}</span>}
                      </div>
                      {user && (
                        isDone ? <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30">✅ Concluído</Badge>
                        : isEnrolled ? (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => complete.mutate(course.id)} disabled={complete.isPending}>
                            {complete.isPending ? "Emitindo..." : "Marcar como Concluído"}
                          </Button>
                        ) : (
                          <Button size="sm" className="w-full" onClick={() => enroll.mutate(course.id)} disabled={enroll.isPending}>
                            {enroll.isPending ? "Matriculando..." : "Matricular-se"}
                          </Button>
                        )
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredCourses.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">Nenhum curso encontrado.</p>}
            </div>
          )}
        </div>
      )}

      {tab === "meus" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCourses.length === 0 ? <p className="text-muted-foreground text-center py-8 col-span-2">Você ainda não está matriculado em nenhum curso.</p> : myCourses.map((e: any) => (
            <Card key={e.enrollment?.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{e.course?.title}</p>
                  {e.enrollment?.completedAt ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Concluído</Badge> : <Badge variant="outline">Em progresso</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{e.course?.specialty}</p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${e.enrollment?.progress || 0}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{e.enrollment?.progress || 0}% concluído</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "certs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.length === 0 ? <p className="text-muted-foreground text-center py-8 col-span-2">Nenhum certificado emitido ainda. Conclua um curso para obter seu certificado.</p>
          : certs.map((c: any) => (
            <Card key={c.cert?.id} className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📜</span>
                  <div>
                    <p className="font-semibold text-purple-300">{c.course?.title}</p>
                    <p className="text-xs text-muted-foreground">Emitido em {new Date(c.cert?.issuedAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-xs text-muted-foreground font-mono break-all">{c.cert?.hash}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
