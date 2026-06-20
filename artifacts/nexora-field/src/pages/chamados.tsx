import { useListServiceOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Chamados() {
  const { data: chamados, isLoading } = useListServiceOrders();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Chamados</h1>
        {user?.role === "company" && (
          <Link href="/chamados/novo">
            <Button>Novo Chamado</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chamados?.map(chamado => (
            <Link key={chamado.id} href={`/chamados/${chamado.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{chamado.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded">{chamado.category}</span>
                    <span className="font-bold text-foreground">R$ {chamado.value}</span>
                  </div>
                  <div className="text-sm">
                    <p>{chamado.city}, {chamado.state}</p>
                    <p>Status: {chamado.status}</p>
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
