import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { getAuthToken } from "@/lib/auth";

const API = "/api";
const authFetch = async (url: string) => {
  const token = getAuthToken();
  const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return r.ok ? r.json() : [];
};

export default function Tecnicos() {
  const [search, setSearch] = useState("");
  const [filterHomologado, setFilterHomologado] = useState(false);
  const [filterAcademy, setFilterAcademy] = useState(false);
  const [filterMinScore, setFilterMinScore] = useState("");

  const { data: tecnicos = [], isLoading } = useQuery({
    queryKey: ["tecnicos"],
    queryFn: () => authFetch(`${API}/technicians`),
  });

  // Local filtering (search + optional academy filters when no backend filter)
  const filtered = (tecnicos as any[]).filter((t: any) => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.city?.toLowerCase().includes(search.toLowerCase()) || t.state?.toLowerCase().includes(search.toLowerCase()) || t.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Diretório de Técnicos</h1>
        <p className="text-muted-foreground text-sm">{filtered.length} técnicos encontrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar por nome, cidade, especialidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <button
          onClick={() => setFilterHomologado(!filterHomologado)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${filterHomologado ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "border-border text-muted-foreground hover:border-blue-500/40"}`}
        >
          ✅ Homologado Nexora
        </button>
        <button
          onClick={() => setFilterAcademy(!filterAcademy)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${filterAcademy ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" : "border-border text-muted-foreground hover:border-yellow-500/40"}`}
        >
          🎓 Com certificação Academy
        </button>
        {(filterHomologado || filterAcademy || search) && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setFilterHomologado(false); setFilterAcademy(false); setFilterMinScore(""); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((tecnico: any) => (
            <Link key={tecnico.id} href={`/tecnicos/${tecnico.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                      {tecnico.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{tecnico.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{tecnico.city}, {tecnico.state}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {tecnico.rating ? (
                      <span className="text-yellow-400">⭐ {tecnico.rating.toFixed(1)}</span>
                    ) : null}
                    {tecnico.totalServices > 0 && (
                      <span className="text-muted-foreground text-xs">{tecnico.totalServices} serviços</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tecnico.specialties?.slice(0, 3).map((spec: string) => (
                      <span key={spec} className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded">
                        {spec}
                      </span>
                    ))}
                    {tecnico.specialties?.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{tecnico.specialties.length - 3}</span>
                    )}
                  </div>
                  {tecnico.isAvailable && (
                    <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Disponível</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-muted-foreground">Nenhum técnico encontrado com os filtros aplicados.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setFilterHomologado(false); setFilterAcademy(false); }}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
