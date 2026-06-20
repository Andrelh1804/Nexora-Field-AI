import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function Developer() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"keys" | "webhooks">("keys");
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("service_order.created,application.accepted");

  const { data: keys = [] } = useQuery({ queryKey: ["dev-keys"], queryFn: () => authFetch("/api/developer/keys") });
  const { data: webhooks = [] } = useQuery({ queryKey: ["dev-webhooks"], queryFn: () => authFetch("/api/developer/webhooks") });

  const createKey = useMutation({
    mutationFn: (data: any) => authFetch("/api/developer/keys", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["dev-keys"] }); setNewKey(data.rawKey); setKeyName(""); toast({ title: "API Key criada!", description: "Copie a chave agora — ela não será exibida novamente." }); }
  });
  const deleteKey = useMutation({ mutationFn: (id: number) => authFetch(`/api/developer/keys/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-keys"] }) });
  const createWebhook = useMutation({
    mutationFn: (data: any) => authFetch("/api/developer/webhooks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dev-webhooks"] }); setWebhookUrl(""); toast({ title: "Webhook criado!" }); }
  });
  const deleteWebhook = useMutation({ mutationFn: (id: number) => authFetch(`/api/developer/webhooks/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-webhooks"] }) });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">⚙️ Developer</h1>
        <p className="text-muted-foreground mt-1">API Keys e Webhooks para integração</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["keys", "webhooks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "keys" ? "🔑 API Keys" : "🔗 Webhooks"}
          </button>
        ))}
      </div>

      {tab === "keys" && (
        <div className="space-y-4">
          {newKey && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-4 space-y-2">
                <p className="font-semibold text-green-400">✅ Chave criada! Copie agora — não será exibida novamente.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/40 rounded px-3 py-2 text-xs font-mono text-green-300 break-all">{newKey}</code>
                  <Button size="sm" onClick={() => { navigator.clipboard.writeText(newKey); toast({ title: "Copiado!" }); }}>Copiar</Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setNewKey(null)}>Fechar</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Nova API Key</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Nome da chave (ex: Integração ERP)" value={keyName} onChange={e => setKeyName(e.target.value)} />
              <Button onClick={() => createKey.mutate({ name: keyName, scopes: ["read", "write"] })} disabled={!keyName || createKey.isPending}>
                {createKey.isPending ? "Gerando..." : "Gerar Chave"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Chaves Existentes ({keys.length})</h3>
            {keys.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">Nenhuma API Key criada ainda.</p>
            : keys.map((k: any) => (
              <Card key={k.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{k.name}</p>
                      <Badge variant="outline" className="text-xs">{k.active ? "Ativa" : "Inativa"}</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground">{k.keyPrefix}••••••••••••••••</code>
                    <div className="flex gap-1">{k.scopes?.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteKey.mutate(k.id)}>Revogar</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Novo Webhook</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="URL do endpoint (https://...)" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
              <Input placeholder="Eventos (separados por vírgula)" value={webhookEvents} onChange={e => setWebhookEvents(e.target.value)} />
              <p className="text-xs text-muted-foreground">Eventos disponíveis: service_order.created, service_order.updated, application.accepted, rating.created</p>
              <Button onClick={() => createWebhook.mutate({ url: webhookUrl, events: webhookEvents.split(",").map((e: string) => e.trim()) })} disabled={!webhookUrl || createWebhook.isPending}>
                {createWebhook.isPending ? "Criando..." : "Criar Webhook"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Webhooks Configurados ({webhooks.length})</h3>
            {webhooks.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">Nenhum webhook configurado.</p>
            : webhooks.map((h: any) => (
              <Card key={h.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-mono truncate text-primary">{h.url}</p>
                    <div className="flex flex-wrap gap-1">{h.events?.map((e: string) => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}</div>
                    {h.failCount > 0 && <p className="text-xs text-red-400">{h.failCount} falha(s)</p>}
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteWebhook.mutate(h.id)}>Remover</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-muted/20">
        <CardHeader><CardTitle className="text-base">Documentação da API</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Base URL: <code className="bg-black/30 px-1 rounded text-primary">/api</code></p>
          <p>Autenticação: <code className="bg-black/30 px-1 rounded">Authorization: Bearer &lt;token&gt;</code></p>
          <p>Rate limit: 1000 req/hora por chave</p>
        </CardContent>
      </Card>
    </div>
  );
}
