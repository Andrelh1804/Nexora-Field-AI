import { useParams } from "wouter";
import { useGetTechnician, useListTechnicianRatings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SPEC_LABELS: Record<string, string> = {
  fibra_optica: "Fibra Óptica",
  redes: "Redes",
  cftv: "CFTV",
  telecom: "Telecom",
  automacao_industrial: "Automação Industrial",
  infraestrutura: "Infraestrutura",
};

function StarRating({ score }: { score: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(Math.round(score))}{"☆".repeat(5 - Math.round(score))}
    </span>
  );
}

export default function TecnicoProfile() {
  const { id } = useParams();
  const numId = Number(id);

  const { data: tecnico, isLoading } = useGetTechnician(numId);
  const { data: ratings, isLoading: isLoadingRatings } = useListTechnicianRatings(numId);

  if (isLoading || !tecnico) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-muted-foreground">Carregando...</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {tecnico.photoUrl ? (
              <img src={tecnico.photoUrl} alt={tecnico.name} className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {tecnico.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{tecnico.name}</h1>
              <p className="text-muted-foreground">{tecnico.city}, {tecnico.state}</p>
              {tecnico.rating && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRating score={tecnico.rating} />
                  <span className="text-sm font-medium">{tecnico.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({tecnico.totalServices} serviços)</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {tecnico.specialties.map(spec => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {SPEC_LABELS[spec] || spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {tecnico.bio && (
        <Card>
          <CardHeader><CardTitle>Sobre</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{tecnico.bio}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{tecnico.email}</span></p>
          {tecnico.phone && <p><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{tecnico.phone}</span></p>}
          {tecnico.whatsapp && <p><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{tecnico.whatsapp}</span></p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Avaliações {tecnico.rating ? `(${tecnico.rating.toFixed(1)} ★)` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRatings ? (
            <p className="text-muted-foreground">Carregando avaliações...</p>
          ) : ratings?.length ? (
            <div className="space-y-4">
              {ratings.map(rating => (
                <div key={rating.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <StarRating score={rating.score} />
                    <span className="text-sm text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {rating.comment && <p className="text-sm text-muted-foreground">{rating.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
