import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
function authH(): Record<string, string> {
  const t = localStorage.getItem("nexora_token");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}
const apiFetch = async (url: string, opts: RequestInit = {}) => {
  const r = await fetch(url, { ...opts, headers: { ...authH(), ...(opts.headers as Record<string, string> || {}) } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

type Tab = "empresa" | "social" | "branding" | "ai" | "pagamentos" | "whatsapp" | "email";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "empresa", label: "Dados da Empresa", icon: "🏢" },
  { id: "social", label: "Redes Sociais", icon: "📱" },
  { id: "branding", label: "Identidade Visual", icon: "🎨" },
  { id: "ai", label: "Inteligência Artificial", icon: "🤖" },
  { id: "pagamentos", label: "Mercado Pago", icon: "💳" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "email", label: "Email", icon: "📧" },
];

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  if (type === "textarea") return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
      />
    </div>
  );
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SectionSave({ onSave, loading }: { onSave: () => void; loading: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-border mt-4">
      <Button onClick={onSave} disabled={loading}>{loading ? "Salvando..." : "💾 Salvar Alterações"}</Button>
    </div>
  );
}

export default function AdminConfiguracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("empresa");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, Record<string, string>>>({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => apiFetch(`${API}/admin/platform-settings`),
  });

  // Local state for each section
  const [company, setCompany] = useState<Record<string, string> | null>(null);
  const [social, setSocial] = useState<Record<string, string> | null>(null);
  const [branding, setBranding] = useState<Record<string, string> | null>(null);
  const [ai, setAi] = useState<Record<string, string> | null>(null);
  const [pagamentos, setPagamentos] = useState<Record<string, string> | null>(null);
  const [whatsapp, setWhatsapp] = useState<Record<string, string> | null>(null);
  const [email, setEmail] = useState<Record<string, string> | null>(null);

  // Initialize local state from settings when loaded
  const s = settings ?? {};
  const companyData = company ?? s.company ?? {};
  const socialData = social ?? s.social ?? {};
  const brandingData = branding ?? s.branding ?? {};
  const aiData = ai ?? s.ai ?? {};
  const pagamentosData = pagamentos ?? s.mercadopago ?? {};
  const whatsappData = whatsapp ?? s.whatsapp ?? {};
  const emailData = email ?? s.email ?? {};

  const save = useMutation({
    mutationFn: ({ key, data }: { key: string; data: Record<string, string> }) =>
      apiFetch(`${API}/admin/platform-settings/${key}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
      qc.invalidateQueries({ queryKey: ["platform-settings", "public"] });
      toast({ title: "✅ Configurações salvas!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const testAI = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await apiFetch(`${API}/admin/platform-settings/test/ai`, {
        method: "POST",
        body: JSON.stringify({ geminiApiKey: aiData.geminiApiKey }),
      });
      setTestResult(r);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    }
    setTesting(false);
  };

  const testEmail = async () => {
    setTesting(true);
    try {
      const r = await apiFetch(`${API}/admin/platform-settings/test/email`, { method: "POST", body: JSON.stringify(emailData) });
      setTestResult(r);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    }
    setTesting(false);
  };

  if (user?.role !== "admin_master") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-4xl">🔒</p>
        <p className="font-semibold">Acesso restrito ao Admin Master.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Configurações Gerais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie todos os dados da plataforma sem precisar de código.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setTestResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
              tab === t.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-5">

            {/* ── EMPRESA ─────────────────────────────────────────── */}
            {tab === "empresa" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">🏢 Dados Institucionais</CardTitle></CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome da Empresa" value={companyData.name ?? ""} onChange={v => setCompany({ ...companyData, name: v })} />
                  <Field label="Razão Social" value={companyData.razaoSocial ?? ""} onChange={v => setCompany({ ...companyData, razaoSocial: v })} />
                  <Field label="CNPJ" value={companyData.cnpj ?? ""} onChange={v => setCompany({ ...companyData, cnpj: v })} />
                  <Field label="Email Principal" value={companyData.email ?? ""} onChange={v => setCompany({ ...companyData, email: v })} type="email" />
                  <Field label="Telefone" value={companyData.phone ?? ""} onChange={v => setCompany({ ...companyData, phone: v })} />
                  <Field label="WhatsApp" value={companyData.whatsapp ?? ""} onChange={v => setCompany({ ...companyData, whatsapp: v })} />
                  <Field label="Endereço" value={companyData.address ?? ""} onChange={v => setCompany({ ...companyData, address: v })} />
                  <Field label="CEP" value={companyData.cep ?? ""} onChange={v => setCompany({ ...companyData, cep: v })} />
                  <Field label="Cidade" value={companyData.city ?? ""} onChange={v => setCompany({ ...companyData, city: v })} />
                  <Field label="Estado" value={companyData.state ?? ""} onChange={v => setCompany({ ...companyData, state: v })} />
                  <Field label="País" value={companyData.country ?? ""} onChange={v => setCompany({ ...companyData, country: v })} />
                  <Field label="Site" value={companyData.site ?? ""} onChange={v => setCompany({ ...companyData, site: v })} placeholder="https://nexorafield.com.br" />
                  <div className="col-span-2">
                    <Field label="Slogan" value={companyData.slogan ?? ""} onChange={v => setCompany({ ...companyData, slogan: v })} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Descrição Institucional" value={companyData.description ?? ""} onChange={v => setCompany({ ...companyData, description: v })} type="textarea" />
                  </div>
                  <div className="col-span-2">
                    <Field label="Missão" value={companyData.mission ?? ""} onChange={v => setCompany({ ...companyData, mission: v })} type="textarea" />
                  </div>
                  <div className="col-span-2">
                    <Field label="Visão" value={companyData.vision ?? ""} onChange={v => setCompany({ ...companyData, vision: v })} type="textarea" />
                  </div>
                  <div className="col-span-2">
                    <Field label="Valores" value={companyData.values ?? ""} onChange={v => setCompany({ ...companyData, values: v })} placeholder="Inovação, Confiança, Excelência..." />
                  </div>
                </div>
                <SectionSave onSave={() => save.mutate({ key: "company", data: companyData })} loading={save.isPending} />
              </>
            )}

            {/* ── REDES SOCIAIS ────────────────────────────────────── */}
            {tab === "social" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">📱 Redes Sociais</CardTitle></CardHeader>
                <p className="text-xs text-muted-foreground">Estes links aparecem automaticamente na Landing Page, rodapé e página de contato.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["Instagram", "instagram", "https://instagram.com/nexorafield"],
                    ["Facebook", "facebook", "https://facebook.com/nexorafield"],
                    ["LinkedIn", "linkedin", "https://linkedin.com/company/nexorafield"],
                    ["YouTube", "youtube", "https://youtube.com/@nexorafield"],
                    ["TikTok", "tiktok", "https://tiktok.com/@nexorafield"],
                    ["X (Twitter)", "twitter", "https://twitter.com/nexorafield"],
                    ["Telegram", "telegram", "https://t.me/nexorafield"],
                    ["GitHub", "github", "https://github.com/nexorafield"],
                    ["Site Institucional", "site", "https://nexorafield.com.br"],
                  ].map(([label, key, placeholder]) => (
                    <Field key={key} label={label} value={socialData[key] ?? ""} onChange={v => setSocial({ ...socialData, [key]: v })} placeholder={placeholder} />
                  ))}
                </div>
                <SectionSave onSave={() => save.mutate({ key: "social", data: socialData })} loading={save.isPending} />
              </>
            )}

            {/* ── IDENTIDADE VISUAL ─────────────────────────────────── */}
            {tab === "branding" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">🎨 Identidade Visual</CardTitle></CardHeader>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Logos (URLs ou caminhos de arquivo)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Logo Principal" value={brandingData.logoUrl ?? ""} onChange={v => setBranding({ ...brandingData, logoUrl: v })} placeholder="/nexora-logo.png" />
                      <Field label="Logo Branca" value={brandingData.logoWhiteUrl ?? ""} onChange={v => setBranding({ ...brandingData, logoWhiteUrl: v })} />
                      <Field label="Logo Escura" value={brandingData.logoDarkUrl ?? ""} onChange={v => setBranding({ ...brandingData, logoDarkUrl: v })} />
                      <Field label="Favicon" value={brandingData.faviconUrl ?? ""} onChange={v => setBranding({ ...brandingData, faviconUrl: v })} />
                      <Field label="Banner Principal" value={brandingData.bannerUrl ?? ""} onChange={v => setBranding({ ...brandingData, bannerUrl: v })} />
                      <Field label="Imagem OG (redes sociais)" value={brandingData.ogImageUrl ?? ""} onChange={v => setBranding({ ...brandingData, ogImageUrl: v })} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Cores da Marca</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        ["Cor Primária", "colorPrimary"],
                        ["Cor Secundária", "colorSecondary"],
                        ["Cor Destaque", "colorAccent"],
                        ["Cor Botões", "colorButton"],
                      ].map(([label, key]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">{label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={brandingData[key] ?? "#3b82f6"}
                              onChange={e => setBranding({ ...brandingData, [key]: e.target.value })}
                              className="w-10 h-9 rounded border border-border cursor-pointer bg-background"
                            />
                            <Input
                              value={brandingData[key] ?? ""}
                              onChange={e => setBranding({ ...brandingData, [key]: e.target.value })}
                              className="font-mono text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Color preview */}
                    <div className="flex gap-2 mt-3">
                      {["colorPrimary", "colorSecondary", "colorAccent", "colorButton"].map(k => (
                        <div key={k} className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: brandingData[k] || "#3b82f6" }} />
                      ))}
                    </div>
                  </div>
                </div>
                <SectionSave onSave={() => save.mutate({ key: "branding", data: brandingData })} loading={save.isPending} />
              </>
            )}

            {/* ── IA ───────────────────────────────────────────────── */}
            {tab === "ai" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">🤖 Configurações de IA (Gemini)</CardTitle></CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Gemini API Key" value={aiData.geminiApiKey ?? ""} onChange={v => setAi({ ...aiData, geminiApiKey: v })} type="password" placeholder="AIza..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Modelo</label>
                    <select
                      value={aiData.geminiModel ?? "gemini-1.5-flash"}
                      onChange={e => setAi({ ...aiData, geminiModel: e.target.value })}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                    </select>
                  </div>
                  <Field label="Temperatura (0–1)" value={aiData.temperature ?? "0.7"} onChange={v => setAi({ ...aiData, temperature: v })} />
                  <Field label="Tokens Máximos" value={aiData.maxTokens ?? "8192"} onChange={v => setAi({ ...aiData, maxTokens: v })} />
                  <div className="col-span-2">
                    <Field label="Prompt Base Copilot" value={aiData.promptCopilot ?? ""} onChange={v => setAi({ ...aiData, promptCopilot: v })} type="textarea" />
                  </div>
                  <div className="col-span-2">
                    <Field label="Prompt Base Vision" value={aiData.promptVision ?? ""} onChange={v => setAi({ ...aiData, promptVision: v })} type="textarea" />
                  </div>
                  <div className="col-span-2">
                    <Field label="Prompt Base Executive AI" value={aiData.promptExecutive ?? ""} onChange={v => setAi({ ...aiData, promptExecutive: v })} type="textarea" />
                  </div>
                </div>
                {/* Test button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={testAI} disabled={testing}>
                    {testing ? "Testando..." : "🔌 Testar Conexão Gemini"}
                  </Button>
                  {testResult && (
                    <span className={`text-sm ${testResult.ok ? "text-green-400" : "text-red-400"}`}>{testResult.message}</span>
                  )}
                </div>
                <SectionSave onSave={() => save.mutate({ key: "ai", data: aiData })} loading={save.isPending} />
              </>
            )}

            {/* ── MERCADO PAGO ──────────────────────────────────────── */}
            {tab === "pagamentos" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">💳 Mercado Pago</CardTitle></CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Modo</label>
                    <div className="flex gap-3 mt-2">
                      {["sandbox", "producao"].map(m => (
                        <button
                          key={m}
                          onClick={() => setPagamentos({ ...pagamentosData, mode: m })}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${pagamentosData.mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                          {m === "sandbox" ? "🧪 Sandbox" : "🚀 Produção"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Field label="Access Token" value={pagamentosData.accessToken ?? ""} onChange={v => setPagamentos({ ...pagamentosData, accessToken: v })} type="password" placeholder="APP_USR-..." />
                  </div>
                  <div className="col-span-2">
                    <Field label="Public Key" value={pagamentosData.publicKey ?? ""} onChange={v => setPagamentos({ ...pagamentosData, publicKey: v })} placeholder="APP_USR-..." />
                  </div>
                  <div className="col-span-2">
                    <Field label="Webhook URL" value={pagamentosData.webhookUrl ?? ""} onChange={v => setPagamentos({ ...pagamentosData, webhookUrl: v })} placeholder="https://..." />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" disabled>🔌 Testar Integração</Button>
                  <span className="text-xs text-muted-foreground">Configure as credenciais e salve para testar.</span>
                </div>
                <SectionSave onSave={() => save.mutate({ key: "mercadopago", data: pagamentosData })} loading={save.isPending} />
              </>
            )}

            {/* ── WHATSAPP ──────────────────────────────────────────── */}
            {tab === "whatsapp" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">💬 WhatsApp via Twilio</CardTitle></CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Twilio Account SID" value={whatsappData.twilioSid ?? ""} onChange={v => setWhatsapp({ ...whatsappData, twilioSid: v })} type="password" placeholder="AC..." />
                  </div>
                  <div className="col-span-2">
                    <Field label="Twilio Auth Token" value={whatsappData.twilioToken ?? ""} onChange={v => setWhatsapp({ ...whatsappData, twilioToken: v })} type="password" />
                  </div>
                  <Field label="Número WhatsApp (Twilio)" value={whatsappData.twilioNumber ?? ""} onChange={v => setWhatsapp({ ...whatsappData, twilioNumber: v })} placeholder="+14155238886" />
                  <div className="col-span-2">
                    <Field label="Templates de Mensagem (JSON)" value={whatsappData.templates ?? ""} onChange={v => setWhatsapp({ ...whatsappData, templates: v })} type="textarea" placeholder='{"boas_vindas": "Olá {{name}}!"}' />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" disabled>📱 Enviar Mensagem de Teste</Button>
                  <span className="text-xs text-muted-foreground">Configure as credenciais e salve primeiro.</span>
                </div>
                <SectionSave onSave={() => save.mutate({ key: "whatsapp", data: whatsappData })} loading={save.isPending} />
              </>
            )}

            {/* ── EMAIL ─────────────────────────────────────────────── */}
            {tab === "email" && (
              <>
                <CardHeader className="p-0"><CardTitle className="text-base">📧 Configurações de Email (Resend)</CardTitle></CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Resend API Key" value={emailData.resendApiKey ?? ""} onChange={v => setEmail({ ...emailData, resendApiKey: v })} type="password" placeholder="re_..." />
                  </div>
                  <Field label="Email Remetente" value={emailData.senderEmail ?? ""} onChange={v => setEmail({ ...emailData, senderEmail: v })} placeholder="noreply@nexorafield.com.br" />
                  <Field label="Nome Remetente" value={emailData.senderName ?? ""} onChange={v => setEmail({ ...emailData, senderName: v })} placeholder="Nexora Field AI" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={testEmail} disabled={testing}>
                    {testing ? "Enviando..." : "📨 Enviar Email de Teste"}
                  </Button>
                  {testResult && (
                    <span className={`text-sm ${testResult.ok ? "text-green-400" : "text-red-400"}`}>{testResult.message}</span>
                  )}
                </div>
                <SectionSave onSave={() => save.mutate({ key: "email", data: emailData })} loading={save.isPending} />
              </>
            )}

          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-blue-400">ℹ️ Configurações Gerais</strong> — Estas configurações são consumidas automaticamente pela Landing Page, rodapé, páginas de contato e integrações. API keys são armazenadas de forma segura e nunca expostas ao frontend público.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
