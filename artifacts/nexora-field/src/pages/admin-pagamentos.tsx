import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function authHeader() {
  const token = localStorage.getItem("nexora_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Gateway = "mercado_pago" | "stripe" | "pix_manual" | "pagseguro" | "asaas";

interface PaymentConfig {
  id: number;
  gateway: Gateway;
  displayName: string;
  enabled: boolean;
  sandboxMode: boolean;
  publicKey: string | null;
  secretKey: string | null;
  accessToken: string | null;
  webhookSecret: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
  pixBeneficiaryName: string | null;
  pixBeneficiaryCity: string | null;
  extraConfig: string | null;
}

interface StatusItem {
  gateway: Gateway;
  displayName: string;
  enabled: boolean;
  sandboxMode: boolean;
  hasKeys: boolean;
}

const GATEWAY_META: Record<Gateway, { icon: string; color: string; description: string }> = {
  mercado_pago: {
    icon: "🇧🇷",
    color: "text-yellow-400",
    description: "Aceite Pix, cartão de crédito e boleto via Mercado Pago.",
  },
  stripe: {
    icon: "💳",
    color: "text-blue-400",
    description: "Processamento global de cartões de crédito e débito.",
  },
  pix_manual: {
    icon: "⚡",
    color: "text-green-400",
    description: "Pagamentos via Pix com chave fixa e confirmação manual.",
  },
  pagseguro: {
    icon: "🟦",
    color: "text-blue-300",
    description: "Checkout PagSeguro com boleto, cartão e Pix.",
  },
  asaas: {
    icon: "🔶",
    color: "text-orange-400",
    description: "Plataforma de cobranças, assinaturas e split de pagamentos.",
  },
};

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "evp", label: "Chave Aleatória (EVP)" },
];

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function SecretInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••••••"}
          className="pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <EyeIcon show={show} />
        </button>
      </div>
    </div>
  );
}

function GatewayCard({
  status,
  onConfigure,
}: {
  status: StatusItem;
  onConfigure: (g: Gateway) => void;
}) {
  const meta = GATEWAY_META[status.gateway];
  return (
    <Card className={`border transition-all ${status.enabled ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <p className={`font-semibold ${meta.color}`}>{status.displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant={status.enabled ? "default" : "outline"}
              className={status.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
            >
              {status.enabled ? "Ativo" : "Inativo"}
            </Badge>
            {status.sandboxMode && status.enabled && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-[10px]">
                Sandbox
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${status.hasKeys ? "bg-green-500" : "bg-muted"}`} />
            <span className="text-xs text-muted-foreground">
              {status.hasKeys ? "Credenciais configuradas" : "Sem credenciais"}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onConfigure(status.gateway)}>
            ⚙️ Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigModal({
  gateway,
  onClose,
}: {
  gateway: Gateway;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const meta = GATEWAY_META[gateway];

  const { data: config, isLoading } = useQuery<PaymentConfig>({
    queryKey: ["payment-config", gateway],
    queryFn: async () => {
      const res = await fetch(`${API}/admin/payment-config/${gateway}`, {
        headers: authHeader() as Record<string, string>,
      });
      if (!res.ok) throw new Error("Erro ao carregar");
      return res.json();
    },
  });

  const [form, setForm] = useState<Partial<PaymentConfig>>({});
  const [loaded, setLoaded] = useState(false);

  if (config && !loaded) {
    setForm({
      enabled: config.enabled,
      sandboxMode: config.sandboxMode,
      publicKey: config.publicKey ?? "",
      secretKey: config.secretKey ?? "",
      accessToken: config.accessToken ?? "",
      webhookSecret: config.webhookSecret ?? "",
      pixKey: config.pixKey ?? "",
      pixKeyType: config.pixKeyType ?? "evp",
      pixBeneficiaryName: config.pixBeneficiaryName ?? "",
      pixBeneficiaryCity: config.pixBeneficiaryCity ?? "",
    });
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/admin/payment-config/${gateway}`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configuração salva!", description: `${meta.icon} ${GATEWAY_META[gateway].description.split(".")[0]} atualizado.` });
      qc.invalidateQueries({ queryKey: ["payment-config-status"] });
      qc.invalidateQueries({ queryKey: ["payment-config", gateway] });
      onClose();
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const set = (key: keyof PaymentConfig, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isMercadoPago = gateway === "mercado_pago";
  const isStripe = gateway === "stripe";
  const isPixManual = gateway === "pix_manual";
  const isPagSeguro = gateway === "pagseguro";
  const isAsaas = gateway === "asaas";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h2 className="font-bold text-lg">Configurar {config?.displayName ?? gateway}</h2>
              <p className="text-xs text-muted-foreground">Gateway de pagamento</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
        </div>

        {isLoading || !loaded ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando...</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Status toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => set("enabled", !form.enabled)}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.enabled ? "border-green-500/40 bg-green-500/10" : "border-border hover:border-muted-foreground/30"}`}
              >
                <div className={`w-9 h-5 rounded-full relative transition-colors ${form.enabled ? "bg-green-500" : "bg-muted"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.enabled ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="text-sm font-medium">{form.enabled ? "Ativo" : "Inativo"}</span>
              </div>
              {!isPixManual && (
                <div
                  onClick={() => set("sandboxMode", !form.sandboxMode)}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.sandboxMode ? "border-yellow-500/40 bg-yellow-500/10" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${form.sandboxMode ? "bg-yellow-500" : "bg-muted"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.sandboxMode ? "left-4" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium">{form.sandboxMode ? "Sandbox" : "Produção"}</span>
                </div>
              )}
            </div>

            {form.sandboxMode && !isPixManual && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <span className="text-yellow-400 text-sm">⚠️</span>
                <p className="text-xs text-yellow-300">Modo sandbox ativo — os pagamentos não serão cobrados. Troque para <strong>Produção</strong> antes de receber pagamentos reais.</p>
              </div>
            )}

            {/* Mercado Pago fields */}
            {(isMercadoPago) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenciais Mercado Pago</p>
                <SecretInput
                  label="Access Token"
                  value={form.accessToken ?? ""}
                  onChange={(v) => set("accessToken", v)}
                  placeholder="APP_USR-..."
                />
                <SecretInput
                  label="Public Key"
                  value={form.publicKey ?? ""}
                  onChange={(v) => set("publicKey", v)}
                  placeholder="APP_USR-..."
                />
                <SecretInput
                  label="Webhook Secret (opcional)"
                  value={form.webhookSecret ?? ""}
                  onChange={(v) => set("webhookSecret", v)}
                  placeholder="Chave para validar webhooks"
                />
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Como obter:</p>
                  <p className="text-xs text-muted-foreground">Acesse <span className="text-primary">mercadopago.com.br</span> → Sua Conta → Credenciais → Credenciais de Produção / Teste</p>
                </div>
              </div>
            )}

            {/* Stripe fields */}
            {isStripe && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenciais Stripe</p>
                <SecretInput
                  label="Publishable Key"
                  value={form.publicKey ?? ""}
                  onChange={(v) => set("publicKey", v)}
                  placeholder="pk_live_... ou pk_test_..."
                />
                <SecretInput
                  label="Secret Key"
                  value={form.secretKey ?? ""}
                  onChange={(v) => set("secretKey", v)}
                  placeholder="sk_live_... ou sk_test_..."
                />
                <SecretInput
                  label="Webhook Signing Secret"
                  value={form.webhookSecret ?? ""}
                  onChange={(v) => set("webhookSecret", v)}
                  placeholder="whsec_..."
                />
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Como obter:</p>
                  <p className="text-xs text-muted-foreground">Acesse <span className="text-primary">dashboard.stripe.com</span> → Developers → API Keys</p>
                </div>
              </div>
            )}

            {/* PagSeguro fields */}
            {isPagSeguro && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenciais PagSeguro</p>
                <SecretInput
                  label="Token de Acesso"
                  value={form.accessToken ?? ""}
                  onChange={(v) => set("accessToken", v)}
                  placeholder="Token da conta PagSeguro"
                />
                <SecretInput
                  label="Chave Pública"
                  value={form.publicKey ?? ""}
                  onChange={(v) => set("publicKey", v)}
                  placeholder="Chave pública PagSeguro"
                />
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Como obter:</p>
                  <p className="text-xs text-muted-foreground">Acesse <span className="text-primary">sandbox.pagseguro.uol.com.br</span> → Perfil → Dados da Conta</p>
                </div>
              </div>
            )}

            {/* Asaas fields */}
            {isAsaas && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenciais Asaas</p>
                <SecretInput
                  label="API Key"
                  value={form.accessToken ?? ""}
                  onChange={(v) => set("accessToken", v)}
                  placeholder="$aact_..."
                />
                <SecretInput
                  label="Webhook Token (opcional)"
                  value={form.webhookSecret ?? ""}
                  onChange={(v) => set("webhookSecret", v)}
                  placeholder="Token para validar webhooks"
                />
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Como obter:</p>
                  <p className="text-xs text-muted-foreground">Acesse <span className="text-primary">asaas.com</span> → Configurações → Integrações → API Key</p>
                </div>
              </div>
            )}

            {/* Pix fields — shown for all gateways */}
            {isPixManual && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados da Chave Pix</p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Chave</label>
                  <select
                    value={form.pixKeyType ?? "evp"}
                    onChange={(e) => set("pixKeyType", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {PIX_KEY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Chave Pix</label>
                  <Input
                    value={form.pixKey ?? ""}
                    onChange={(e) => set("pixKey", e.target.value)}
                    placeholder="Informe a chave Pix"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Nome do Beneficiário</label>
                  <Input
                    value={form.pixBeneficiaryName ?? ""}
                    onChange={(e) => set("pixBeneficiaryName", e.target.value)}
                    placeholder="Nome para exibir no QR Code"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Cidade do Beneficiário</label>
                  <Input
                    value={form.pixBeneficiaryCity ?? ""}
                    onChange={(e) => set("pixBeneficiaryCity", e.target.value)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <p className="text-xs text-green-300">ℹ️ O Pix Manual gera QR codes estáticos. A confirmação de pagamento deve ser feita manualmente pelo administrador.</p>
                </div>
              </div>
            )}

            {/* Common Pix config for other gateways */}
            {!isPixManual && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pix (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Chave</label>
                    <select
                      value={form.pixKeyType ?? "evp"}
                      onChange={(e) => set("pixKeyType", e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {PIX_KEY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Chave Pix</label>
                    <Input
                      value={form.pixKey ?? ""}
                      onChange={(e) => set("pixKey", e.target.value)}
                      placeholder="Chave Pix"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "💾 Salvar Configuração"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPagamentos() {
  const { user } = useAuth();
  const [configuring, setConfiguring] = useState<Gateway | null>(null);

  const { data: statusList, isLoading } = useQuery<StatusItem[]>({
    queryKey: ["payment-config-status"],
    queryFn: async () => {
      const res = await fetch(`${API}/admin/payment-config-status`, {
        headers: authHeader() as Record<string, string>,
      });
      if (!res.ok) throw new Error("Erro ao buscar status");
      return res.json();
    },
  });

  const activeCount = statusList?.filter((s) => s.enabled).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Pagamento</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie os gateways de pagamento para planos, comissões e recebimentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={activeCount > 0 ? "border-green-500/30 text-green-400" : "border-muted text-muted-foreground"}>
            {activeCount} ativo{activeCount !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-primary border-primary/30">Admin</Badge>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <span className="text-xl">🔐</span>
        <div>
          <p className="text-sm font-medium">Segurança das credenciais</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            As chaves são armazenadas de forma segura no banco de dados. Nunca compartilhe o acesso ao painel administrativo. Em produção, desative o modo Sandbox antes de receber pagamentos reais.
          </p>
        </div>
      </div>

      {/* Use cases */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "📋", label: "Planos de Assinatura", desc: "Técnicos e empresas pagam mensalidade para acesso à plataforma." },
          { icon: "💸", label: "Comissões", desc: "Plataforma retém % de cada chamado concluído como taxa de serviço." },
          { icon: "💰", label: "Carteira do Técnico", desc: "Técnicos recebem na carteira virtual e solicitam saque." },
        ].map((u) => (
          <Card key={u.label} className="border-border bg-card/50">
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-2xl">{u.icon}</span>
              <p className="text-sm font-semibold mt-2">{u.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{u.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gateway cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Gateways Disponíveis</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(statusList ?? []).map((s) => (
              <GatewayCard
                key={s.gateway}
                status={s}
                onConfigure={(g) => setConfiguring(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Webhook instructions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🔗 URLs de Webhook</CardTitle>
          <CardDescription>Configure estas URLs nos painéis dos gateways para receber notificações de pagamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "Mercado Pago", path: "/api/payments/webhook" },
            { label: "Stripe", path: "/api/payments/webhook/stripe" },
            { label: "PagSeguro", path: "/api/payments/webhook/pagseguro" },
            { label: "Asaas", path: "/api/payments/webhook/asaas" },
          ].map((w) => (
            <div key={w.label} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">{w.label}</span>
              <code className="text-xs text-primary font-mono flex-1 truncate">{`${window.location.origin}${w.path}`}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${w.path}`); }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Copiar"
              >
                📋
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {configuring && (
        <ConfigModal gateway={configuring} onClose={() => setConfiguring(null)} />
      )}
    </div>
  );
}
