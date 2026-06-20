import { useListRankings, useGetMyRanking } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string; min: number; next: number | null }> = {
  bronze:   { label: "Bronze",   color: "text-amber-700",   bg: "bg-amber-700/20 border-amber-700/30",   emoji: "🥉", min: 0,    next: 250 },
  prata:    { label: "Prata",    color: "text-slate-300",   bg: "bg-slate-400/20 border-slate-400/30",   emoji: "🥈", min: 250,  next: 800 },
  ouro:     { label: "Ouro",     color: "text-yellow-400",  bg: "bg-yellow-500/20 border-yellow-500/30", emoji: "🥇", min: 800,  next: 2000 },
  platina:  { label: "Platina",  color: "text-cyan-300",    bg: "bg-cyan-500/20 border-cyan-500/30",     emoji: "💎", min: 2000, next: 5000 },
  diamante: { label: "Diamante", color: "text-blue-300",    bg: "bg-blue-500/20 border-blue-500/30",     emoji: "💠", min: 5000, next: null },
};

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function ProgressBar({ score, level }: { score: number; level: string }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  if (!cfg.next) return <div className="h-2 rounded-full bg-blue-500 w-full" />;
  const progress = Math.min(((score - cfg.min) / (cfg.next - cfg.min)) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(score)} pts</span>
        <span>Próximo nível: {cfg.next} pts</span>
      </div>
    </div>
  );
}

export default function Ranking() {
  const { user } = useAuth();
  const { data: rankings = [], isLoading } = useListRankings();
  const { data: myRanking } = useGetMyRanking({ query: { queryKey: ["rankings", "me"], enabled: user?.role === "technician" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ranking Nacional</h1>
        <div className="text-sm text-muted-foreground">{rankings.length} técnicos</div>
      </div>

      {/* My ranking card (technicians only) */}
      {user?.role === "technician" && myRanking && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              Minha Posição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-primary">#{myRanking.position || "—"}</span>
                <div>
                  <LevelBadge level={myRanking.level} />
                  <p className="text-sm text-muted-foreground mt-1">{myRanking.completedOrders} chamados concluídos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{Math.round(myRanking.score)} pts</p>
                {myRanking.avgRating && <p className="text-sm text-muted-foreground">⭐ {Number(myRanking.avgRating).toFixed(1)}</p>}
              </div>
            </div>
            <ProgressBar score={myRanking.score} level={myRanking.level} />
          </CardContent>
        </Card>
      )}

      {/* Level guide */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
          <Card key={key} className={`border ${cfg.bg} text-center`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl">{cfg.emoji}</p>
              <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-muted-foreground">{cfg.min}+ pts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum técnico no ranking ainda.</p>
          ) : (
            <div className="space-y-2">
              {rankings.map((entry: any, index: number) => (
                <div
                  key={entry.technicianId ?? index}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                    ${index === 0 ? "border-yellow-500/30 bg-yellow-500/5" :
                      index === 1 ? "border-slate-400/30 bg-slate-400/5" :
                      index === 2 ? "border-amber-700/30 bg-amber-700/5" :
                      "border-border bg-card/50 hover:bg-card"}`}
                >
                  {/* Position */}
                  <div className="w-8 text-center">
                    {index === 0 ? <span className="text-xl">🥇</span> :
                     index === 1 ? <span className="text-xl">🥈</span> :
                     index === 2 ? <span className="text-xl">🥉</span> :
                     <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {entry.name?.[0] || "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.city}, {entry.state}</p>
                  </div>

                  {/* Level */}
                  <LevelBadge level={entry.level} />

                  {/* Stats */}
                  <div className="text-right hidden sm:block">
                    <p className="font-bold">{Math.round(entry.score)} pts</p>
                    <p className="text-xs text-muted-foreground">{entry.completedOrders} chamados</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
