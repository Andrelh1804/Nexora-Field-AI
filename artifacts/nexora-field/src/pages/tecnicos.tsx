import { useListTechnicians } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Tecnicos() {
  const { data: tecnicos, isLoading } = useListTechnicians();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Diretório de Técnicos</h1>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tecnicos?.map(tecnico => (
            <Link key={tecnico.id} href={`/tecnicos/${tecnico.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{tecnico.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p>{tecnico.city}, {tecnico.state}</p>
                    <p>Avaliação: <strong className="text-foreground">{tecnico.rating?.toFixed(1) || 'N/A'}</strong></p>
                    <p>Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {tecnico.specialties.map(spec => (
                        <span key={spec} className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
