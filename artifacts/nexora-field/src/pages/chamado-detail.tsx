import { useParams } from "wouter";
import { useGetServiceOrder, useGetAiMatch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  aceito: "Aceito",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aceito: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  em_andamento: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  finalizado: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelado: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ChamadoDetail() {
  const { id } = useParams();
  const numId = Number(id);

  const { data: chamado, isLoading } = useGetServiceOrder(numId);
  const { data: matches } = useGetAiMatch(numId);

  if (isLoading || !chamado) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-muted-foreground">Carregando...</div>
    </div>
  );

  const topMatch = matches?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">{chamado.title}</h1>
        <Badge className={STATUS_COLORS[chamado.status] || ""}>
          {STATUS_LABELS[chamado.status] || chamado.status}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalhes do Chamado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <p className="font-medium capitalize">{chamado.category.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-medium text-green-400">R$ {Number(chamado.value).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local</p>
              <p className="font-medium">{chamado.city}, {chamado.state}</p>
            </div>
            {chamado.sla && (
              <div>
                <p className="text-sm text-muted-foreground">SLA</p>
                <p className="font-medium">{chamado.sla}</p>
              </div>
            )}
          </div>
          {chamado.address && (
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{chamado.address}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Descrição</p>
            <p className="mt-1">{chamado.description}</p>
          </div>
        </CardContent>
      </Card>

      {topMatch && (
        <Card className="border-[var(--color-secondary)]/30">
          <CardHeader>
            <CardTitle className="text-[var(--color-secondary)] flex items-center gap-2">
              🤖 Melhor Match por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{topMatch.technician.name}</p>
                <p className="text-sm text-muted-foreground">{topMatch.technician.city}, {topMatch.technician.state}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[var(--color-secondary)]">{topMatch.score}%</p>
                <p className="text-xs text-muted-foreground">compatibilidade</p>
              </div>
            </div>
            {topMatch.reasoning && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{topMatch.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {matches && matches.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Outros Técnicos Compatíveis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {matches.slice(1).map((m, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{m.technician.name}</p>
                  <p className="text-sm text-muted-foreground">{m.technician.city}, {m.technician.state}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{m.score}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
