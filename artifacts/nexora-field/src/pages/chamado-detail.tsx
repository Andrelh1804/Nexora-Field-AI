import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetServiceOrder, useGetAiMatch,
  useGetCheckin, useDoCheckin, useDoCheckout,
  useListEvidences, useAddEvidence,
  useGetAiPricing,
  useListApplications, useApplyToServiceOrder,
  useAcceptApplication, useRejectApplication,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto", aceito: "Aceito", em_andamento: "Em Andamento",
  finalizado: "Finalizado", cancelado: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aceito: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  em_andamento: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  finalizado: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelado: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getGeoCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ latitude: -23.5505, longitude: -46.6333 });
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve({ latitude: -23.5505, longitude: -46.6333 }),
      { timeout: 5000 }
    );
  });
}

function CheckinPanel({ orderId }: { orderId: number }) {
  const { data: checkin, refetch } = useGetCheckin(orderId);
  const checkinMutation = useDoCheckin();
  const checkoutMutation = useDoCheckout();
  const { toast } = useToast();

  const handleCheckin = async () => {
    try {
      const coords = await getGeoCoords();
      await checkinMutation.mutateAsync({ id: orderId, data: coords });
      await refetch();
      toast({ title: "Check-in realizado!", description: "Bom trabalho! Comece o chamado." });
    } catch { toast({ title: "Erro", description: "Não foi possível fazer check-in.", variant: "destructive" }); }
  };

  const handleCheckout = async () => {
    try {
      const coords = await getGeoCoords();
      await checkoutMutation.mutateAsync({ id: orderId, data: { ...coords, notes: "Serviço concluído" } });
      await refetch();
      toast({ title: "Checkout realizado!", description: "Chamado marcado como concluído." });
    } catch { toast({ title: "Erro", description: "Não foi possível fazer checkout.", variant: "destructive" }); }
  };

  const isCheckedIn = !!checkin?.checkinAt;
  const isCheckedOut = !!checkin?.checkoutAt;

  return (
    <Card className={isCheckedIn && !isCheckedOut ? "border-orange-500/30 bg-orange-500/5" : ""}>
      <CardHeader><CardTitle className="text-base">📍 Check-in / Checkout</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isCheckedOut ? (
          <div className="flex items-center gap-2 text-green-400 font-medium">
            ✅ Serviço concluído
            {checkin?.checkoutAt && <span className="text-xs text-muted-foreground">({new Date(checkin.checkoutAt).toLocaleString("pt-BR")})</span>}
          </div>
        ) : isCheckedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-medium">
              🔴 Em andamento
              {checkin?.checkinAt && <span className="text-xs text-muted-foreground">desde {new Date(checkin.checkinAt).toLocaleString("pt-BR")}</span>}
            </div>
            <Button onClick={handleCheckout} disabled={checkoutMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
              {checkoutMutation.isPending ? "Processando..." : "Fazer Checkout ✅"}
            </Button>
          </div>
        ) : (
          <Button onClick={handleCheckin} disabled={checkinMutation.isPending} className="w-full">
            {checkinMutation.isPending ? "Processando..." : "Fazer Check-in 📍"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EvidencePanel({ orderId }: { orderId: number }) {
  const { data: evidences = [], refetch } = useListEvidences(orderId);
  const addMutation = useAddEvidence();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const filename = url.split("/").pop() || "foto.jpg";
    try {
      await addMutation.mutateAsync({ id: orderId, data: { category: "durante", type: "foto", url, filename, description: desc } });
      await refetch();
      setUrl(""); setDesc(""); setShowForm(false);
      toast({ title: "Evidência adicionada!" });
    } catch { toast({ title: "Erro", description: "Não foi possível adicionar evidência.", variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">📷 Evidências ({evidences.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>+ Adicionar</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
            <div className="space-y-1">
              <Label>URL da imagem</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Equipamento instalado" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={addMutation.isPending}>Salvar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}
        {evidences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma evidência ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {evidences.map((ev: any) => (
              <div key={ev.id} className="rounded-lg border border-border overflow-hidden">
                {ev.url ? (
                  <img src={ev.url} alt={ev.description || "Evidência"} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">
                    {ev.type || "arquivo"}
                  </div>
                )}
                {ev.description && <p className="text-xs p-2 text-muted-foreground truncate">{ev.description}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AiPricingPanel({ chamado }: { chamado: any }) {
  const pricingMutation = useGetAiPricing();
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handle = async () => {
    try {
      const r = await pricingMutation.mutateAsync({
        data: {
          title: chamado.title,
          description: chamado.description,
          category: chamado.category,
          city: chamado.city,
          state: chamado.state,
        },
      });
      setResult(r);
    } catch { toast({ title: "Erro", description: "IA indisponível.", variant: "destructive" }); }
  };

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardHeader><CardTitle className="text-base text-purple-400">🤖 Sugestão de Preço por IA</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {result ? (
          <div className="space-y-2">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Mínimo</p>
                <p className="font-bold text-lg">R$ {result.minValue?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sugerido</p>
                <p className="font-bold text-2xl text-purple-400">R$ {result.idealValue?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Premium</p>
                <p className="font-bold text-lg">R$ {result.premiumValue?.toFixed(2)}</p>
              </div>
            </div>
            {result.reasoning && <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">{result.reasoning}</p>}
            {result.aiGenerated && <Badge className="text-xs bg-purple-500/20 text-purple-400">✨ Gemini AI</Badge>}
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Obtenha sugestão de preço baseada em IA para este chamado.</p>
            <Button size="sm" onClick={handle} disabled={pricingMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {pricingMutation.isPending ? "Analisando..." : "Consultar IA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApplicationsPanel({ orderId, isCompany, isTechnician }: { orderId: number; isCompany: boolean; isTechnician: boolean }) {
  const { data: applications = [], refetch } = useListApplications(orderId);
  const applyMutation = useApplyToServiceOrder();
  const acceptMutation = useAcceptApplication();
  const rejectMutation = useRejectApplication();
  const { toast } = useToast();
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    try {
      await applyMutation.mutateAsync({ id: orderId, data: {} });
      await refetch();
      setApplied(true);
      toast({ title: "Candidatura enviada!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.data?.error || "Não foi possível se candidatar.", variant: "destructive" });
    }
  };

  const handleAccept = async (applicationId: number) => {
    try {
      await acceptMutation.mutateAsync({ id: applicationId });
      await refetch();
      toast({ title: "Técnico aceito!" });
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const handleReject = async (applicationId: number) => {
    try {
      await rejectMutation.mutateAsync({ id: applicationId });
      await refetch();
      toast({ title: "Candidatura rejeitada." });
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">👷 Candidaturas ({applications.length})</CardTitle>
        {isTechnician && !applied && (
          <Button size="sm" onClick={handleApply} disabled={applyMutation.isPending}>
            {applyMutation.isPending ? "Enviando..." : "Candidatar-se"}
          </Button>
        )}
        {isTechnician && applied && <Badge className="bg-green-500/20 text-green-400">Candidatura enviada</Badge>}
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma candidatura ainda.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{app.technician?.name || `Técnico #${app.technicianId}`}</p>
                  <p className="text-xs text-muted-foreground">{app.technician?.city}, {app.technician?.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    app.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    app.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }>
                    {app.status === "accepted" ? "aceito" : app.status === "rejected" ? "rejeitado" : "pendente"}
                  </Badge>
                  {isCompany && app.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleAccept(app.id)} disabled={acceptMutation.isPending}>Aceitar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReject(app.id)} disabled={rejectMutation.isPending}>Rejeitar</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChamadoDetail() {
  const { id } = useParams();
  const numId = Number(id);
  const { user } = useAuth();

  const { data: chamado, isLoading } = useGetServiceOrder(numId);
  const { data: matches } = useGetAiMatch(numId);

  if (isLoading || !chamado) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-muted-foreground animate-pulse">Carregando...</div>
    </div>
  );

  const topMatch = matches?.[0];
  const isCompany = user?.role === "company";
  const isTechnician = user?.role === "technician";
  const isActive = ["aceito", "em_andamento"].includes(chamado.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{chamado.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{chamado.city}, {chamado.state}</p>
        </div>
        <Badge className={STATUS_COLORS[chamado.status] || ""}>
          {STATUS_LABELS[chamado.status] || chamado.status}
        </Badge>
      </div>

      {/* Details */}
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

      {/* AI Match (company/admin) */}
      {!isTechnician && topMatch && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">🤖 Melhor Match por IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{topMatch.technician.name}</p>
                <p className="text-sm text-muted-foreground">{topMatch.technician.city}, {topMatch.technician.state}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{topMatch.score}%</p>
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

      {/* AI Pricing (company) */}
      {isCompany && <AiPricingPanel chamado={chamado} />}

      {/* Applications */}
      <ApplicationsPanel orderId={numId} isCompany={isCompany} isTechnician={isTechnician} />

      {/* Check-in / Checkout (technician, when order is active) */}
      {isTechnician && isActive && <CheckinPanel orderId={numId} />}

      {/* Evidences (active/finished orders) */}
      {(isActive || chamado.status === "finalizado") && (
        <EvidencePanel orderId={numId} />
      )}

      {/* Other matches */}
      {!isTechnician && matches && matches.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Outros Técnicos Compatíveis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {matches.slice(1, 5).map((m, i) => (
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
