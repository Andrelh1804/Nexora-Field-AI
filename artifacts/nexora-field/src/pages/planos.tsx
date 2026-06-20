import { useListPlans, useGetMySubscription, useSubscribeToPlan, useCancelSubscription } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PLAN_HIGHLIGHTS: Record<string, { color: string; popular?: boolean }> = {
  "tecnico-pro":      { color: "border-primary",       popular: true },
  "tecnico-premium":  { color: "border-yellow-500" },
  "empresa-pro":      { color: "border-primary",       popular: true },
  "empresa-business": { color: "border-yellow-500" },
};

function PlanCard({ plan, currentPlanId, onSubscribe, isLoading }: {
  plan: any;
  currentPlanId?: number;
  onSubscribe: (id: number) => void;
  isLoading: boolean;
}) {
  const highlight = PLAN_HIGHLIGHTS[plan.slug] || {};
  const isCurrent = currentPlanId === plan.id;

  return (
    <Card className={`relative border-2 transition-all ${highlight.color || "border-border"} ${highlight.popular ? "scale-[1.02]" : ""}`}>
      {highlight.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white px-3">Mais Popular</Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-600 text-white px-3">✓ Ativo</Badge>
        </div>
      )}
      <CardHeader className="text-center pt-6">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-2">
          {plan.price === 0 ? (
            <span className="text-4xl font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-2xl font-medium">R$</span>
              <span className="text-4xl font-bold">{plan.price.toFixed(2).replace(".", ",")}</span>
              <span className="text-muted-foreground">/mês</span>
            </>
          )}
        </div>
        {plan.maxOrders && (
          <p className="text-sm text-muted-foreground">Até {plan.maxOrders} chamados/mês</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={isCurrent ? "outline" : "default"}
          disabled={isCurrent || isLoading}
          onClick={() => !isCurrent && onSubscribe(plan.id)}
        >
          {isCurrent ? "Plano Atual" : plan.price === 0 ? "Usar Grátis" : "Assinar"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Planos() {
  const { user } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = useListPlans();
  const { data: subscription, refetch: refetchSub } = useGetMySubscription();
  const subscribeMutation = useSubscribeToPlan();
  const cancelMutation = useCancelSubscription();
  const { toast } = useToast();

  const target = user?.role === "company" ? "company" : "technician";
  const filteredPlans = plans.filter((p: any) => p.target === target);
  const currentPlanId = subscription?.planId;

  const handleSubscribe = async (planId: number) => {
    try {
      await subscribeMutation.mutateAsync({ data: { planId } });
      await refetchSub();
      toast({ title: "Assinatura ativada!", description: "Seu plano foi ativado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível assinar o plano.", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      await refetchSub();
      toast({ title: "Assinatura cancelada", description: "Seu plano foi cancelado." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível cancelar.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Planos Nexora Field</h1>
        <p className="text-muted-foreground text-lg">
          {target === "technician"
            ? "Turbine sua carreira como técnico autônomo"
            : "Gerencie seus chamados com eficiência"}
        </p>
      </div>

      {/* Current subscription banner */}
      {subscription && subscription.status === "ativa" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-400">✓ Plano ativo: {subscription.planName}</p>
              <p className="text-sm text-muted-foreground">
                Renova em: {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelMutation.isPending}>
              Cancelar assinatura
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Planos em breve. Entre em contato com o suporte.
          </CardContent>
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${filteredPlans.length === 2 ? "md:grid-cols-2 max-w-2xl mx-auto" : filteredPlans.length >= 3 ? "md:grid-cols-3" : ""}`}>
          {filteredPlans.map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId ?? undefined}
              onSubscribe={handleSubscribe}
              isLoading={subscribeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* FAQ / Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[
          { icon: "🔒", title: "Pagamento Seguro", desc: "Processado via Stripe com criptografia SSL" },
          { icon: "🔄", title: "Cancele Quando Quiser", desc: "Sem fidelidade ou multas por cancelamento" },
          { icon: "💬", title: "Suporte Dedicado", desc: "Time de suporte disponível via chat" },
        ].map(item => (
          <Card key={item.title}>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl mb-2">{item.icon}</p>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
