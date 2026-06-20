import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Admin() {
  const { data, isLoading } = useGetAdminDashboard();

  if (isLoading || !data) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel de Administração</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Total de Técnicos</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{data.totalTechnicians}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total de Empresas</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{data.totalCompanies}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Chamados Totais</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{data.totalServiceOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Receita Simulada</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-green-500">R$ {data.revenueSimulated.toFixed(2)}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Chamados por Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.ordersByStatus.map(stat => (
                <div key={stat.status} className="flex justify-between">
                  <span className="capitalize">{stat.status.replace('_', ' ')}</span>
                  <span className="font-bold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Chamados por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.ordersByCategory.map(cat => (
                <div key={cat.category} className="flex justify-between">
                  <span className="capitalize">{cat.category.replace('_', ' ')}</span>
                  <span className="font-bold">{cat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
