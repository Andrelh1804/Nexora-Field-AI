import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function authHeader() {
  const token = localStorage.getItem("nexora_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Section = "hero" | "testimonials" | "faq" | "benefits" | "footer";

interface Testimonial { id: number; name: string; role: string; company?: string; content: string; avatar?: string; active: boolean; sortOrder: number; }
interface Faq { id: number; question: string; answer: string; active: boolean; sortOrder: number; }
interface Benefit { id: number; icon: string; title: string; description: string; active: boolean; sortOrder: number; }

export default function AdminLanding() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("hero");
  const [heroForm, setHeroForm] = useState<Record<string, string>>({});
  const [footerForm, setFooterForm] = useState<Record<string, string>>({});
  const [testimonialModal, setTestimonialModal] = useState<Testimonial | "new" | null>(null);
  const [faqModal, setFaqModal] = useState<Faq | "new" | null>(null);
  const [benefitModal, setBenefitModal] = useState<Benefit | "new" | null>(null);
  const [tmForm, setTmForm] = useState<Partial<Testimonial & { avatar?: string }>>({});
  const [faqForm, setFaqForm] = useState<Partial<Faq>>({});
  const [benForm, setBenForm] = useState<Partial<Benefit>>({});

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const res = await fetch(`${API}/landing/settings`, { headers: authHeader() });
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setHeroForm({
        "hero.title": settings["hero.title"] || "",
        "hero.subtitle": settings["hero.subtitle"] || "",
        "hero.cta_primary": settings["hero.cta_primary"] || "",
        "hero.cta_secondary": settings["hero.cta_secondary"] || "",
      });
      setFooterForm({
        "footer.email": settings["footer.email"] || "",
        "footer.phone": settings["footer.phone"] || "",
        "footer.instagram": settings["footer.instagram"] || "",
        "footer.linkedin": settings["footer.linkedin"] || "",
      });
    }
  }, [settings]);

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["landing-testimonials-all"],
    queryFn: async () => {
      const res = await fetch(`${API}/landing/testimonials/all`, { headers: authHeader() });
      return res.json();
    },
  });
  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ["landing-faq-all"],
    queryFn: async () => {
      const res = await fetch(`${API}/landing/faq/all`, { headers: authHeader() });
      return res.json();
    },
  });
  const { data: benefits = [] } = useQuery<Benefit[]>({
    queryKey: ["landing-benefits-all"],
    queryFn: async () => {
      const res = await fetch(`${API}/landing/benefits/all`, { headers: authHeader() });
      return res.json();
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`${API}/landing/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
    },
    onSuccess: () => {
      toast({ title: "Configurações salvas!" });
      qc.invalidateQueries({ queryKey: ["landing-settings"] });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const testimonialMutation = useMutation({
    mutationFn: async ({ method, id, data }: { method: "POST" | "PATCH" | "DELETE"; id?: number; data?: any }) => {
      const url = id ? `${API}/landing/testimonials/${id}` : `${API}/landing/testimonials`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: method !== "DELETE" ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => {
      toast({ title: "Depoimento salvo!" });
      qc.invalidateQueries({ queryKey: ["landing-testimonials-all"] });
      setTestimonialModal(null);
    },
    onError: () => toast({ title: "Erro ao salvar depoimento", variant: "destructive" }),
  });

  const faqMutation = useMutation({
    mutationFn: async ({ method, id, data }: { method: "POST" | "PATCH" | "DELETE"; id?: number; data?: any }) => {
      const url = id ? `${API}/landing/faq/${id}` : `${API}/landing/faq`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: method !== "DELETE" ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => {
      toast({ title: "FAQ salvo!" });
      qc.invalidateQueries({ queryKey: ["landing-faq-all"] });
      setFaqModal(null);
    },
    onError: () => toast({ title: "Erro", variant: "destructive" }),
  });

  const benefitMutation = useMutation({
    mutationFn: async ({ method, id, data }: { method: "POST" | "PATCH" | "DELETE"; id?: number; data?: any }) => {
      const url = id ? `${API}/landing/benefits/${id}` : `${API}/landing/benefits`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: method !== "DELETE" ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => {
      toast({ title: "Benefício salvo!" });
      qc.invalidateQueries({ queryKey: ["landing-benefits-all"] });
      setBenefitModal(null);
    },
    onError: () => toast({ title: "Erro", variant: "destructive" }),
  });

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: "hero", label: "Hero", icon: "🎯" },
    { key: "benefits", label: "Benefícios", icon: "✅" },
    { key: "testimonials", label: "Depoimentos", icon: "💬" },
    { key: "faq", label: "FAQ", icon: "❓" },
    { key: "footer", label: "Rodapé", icon: "🔗" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CMS — Landing Page</h1>
        <p className="text-muted-foreground mt-1">Edite o conteúdo da landing page sem precisar de código</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <Button
            key={s.key}
            variant={section === s.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSection(s.key)}
          >
            {s.icon} {s.label}
          </Button>
        ))}
      </div>

      {section === "hero" && (
        <Card>
          <CardHeader><CardTitle>Seção Hero</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Título Principal</label>
              <Input
                value={heroForm["hero.title"] || ""}
                onChange={e => setHeroForm(f => ({ ...f, "hero.title": e.target.value }))}
                placeholder="Intelligent Field Services"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subtítulo</label>
              <textarea
                value={heroForm["hero.subtitle"] || ""}
                onChange={e => setHeroForm(f => ({ ...f, "hero.subtitle": e.target.value }))}
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Conectamos empresas..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Botão Primário</label>
                <Input
                  value={heroForm["hero.cta_primary"] || ""}
                  onChange={e => setHeroForm(f => ({ ...f, "hero.cta_primary": e.target.value }))}
                  placeholder="Começar Agora"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Botão Secundário</label>
                <Input
                  value={heroForm["hero.cta_secondary"] || ""}
                  onChange={e => setHeroForm(f => ({ ...f, "hero.cta_secondary": e.target.value }))}
                  placeholder="Acessar Conta"
                />
              </div>
            </div>
            <Button onClick={() => saveSettings.mutate(heroForm)} disabled={saveSettings.isPending}>
              {saveSettings.isPending ? "Salvando..." : "Salvar Hero"}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === "footer" && (
        <Card>
          <CardHeader><CardTitle>Rodapé</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">E-mail</label>
                <Input value={footerForm["footer.email"] || ""} onChange={e => setFooterForm(f => ({ ...f, "footer.email": e.target.value }))} placeholder="contato@nexorafield.com.br" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Telefone</label>
                <Input value={footerForm["footer.phone"] || ""} onChange={e => setFooterForm(f => ({ ...f, "footer.phone": e.target.value }))} placeholder="(11) 3000-0000" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Instagram (URL)</label>
                <Input value={footerForm["footer.instagram"] || ""} onChange={e => setFooterForm(f => ({ ...f, "footer.instagram": e.target.value }))} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">LinkedIn (URL)</label>
                <Input value={footerForm["footer.linkedin"] || ""} onChange={e => setFooterForm(f => ({ ...f, "footer.linkedin": e.target.value }))} placeholder="https://linkedin.com/..." />
              </div>
            </div>
            <Button onClick={() => saveSettings.mutate(footerForm)} disabled={saveSettings.isPending}>
              {saveSettings.isPending ? "Salvando..." : "Salvar Rodapé"}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Depoimentos ({testimonials.length})</h2>
            <Button size="sm" onClick={() => { setTmForm({ active: true, sortOrder: 0 }); setTestimonialModal("new"); }}>+ Novo</Button>
          </div>
          <div className="space-y-3">
            {testimonials.length === 0 && <p className="text-muted-foreground text-sm">Nenhum depoimento cadastrado.</p>}
            {testimonials.map(t => (
              <Card key={t.id} className={!t.active ? "opacity-60" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}{t.company ? ` — ${t.company}` : ""}</p>
                      <p className="text-sm mt-2 text-muted-foreground italic">"{t.content}"</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setTmForm(t); setTestimonialModal(t); }}>Editar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30" onClick={() => testimonialMutation.mutate({ method: "DELETE", id: t.id })}>🗑</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {section === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">FAQ ({faqs.length} perguntas)</h2>
            <Button size="sm" onClick={() => { setFaqForm({ active: true, sortOrder: 0 }); setFaqModal("new"); }}>+ Nova Pergunta</Button>
          </div>
          <div className="space-y-3">
            {faqs.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma pergunta cadastrada.</p>}
            {faqs.map(f => (
              <Card key={f.id} className={!f.active ? "opacity-60" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{f.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setFaqForm(f); setFaqModal(f); }}>Editar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30" onClick={() => faqMutation.mutate({ method: "DELETE", id: f.id })}>🗑</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {section === "benefits" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Benefícios ({benefits.length})</h2>
            <Button size="sm" onClick={() => { setBenForm({ icon: "✅", active: true, sortOrder: 0 }); setBenefitModal("new"); }}>+ Novo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.length === 0 && <p className="text-muted-foreground text-sm">Nenhum benefício cadastrado.</p>}
            {benefits.map(b => (
              <Card key={b.id} className={!b.active ? "opacity-60" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{b.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{b.title}</p>
                      <p className="text-sm text-muted-foreground">{b.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setBenForm(b); setBenefitModal(b); }}>Editar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30" onClick={() => benefitMutation.mutate({ method: "DELETE", id: b.id })}>🗑</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {testimonialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTestimonialModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{testimonialModal === "new" ? "Novo Depoimento" : "Editar Depoimento"}</h2>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground mb-1 block">Nome</label><Input value={tmForm.name || ""} onChange={e => setTmForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Cargo/Função</label><Input value={tmForm.role || ""} onChange={e => setTmForm(f => ({ ...f, role: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Empresa</label><Input value={tmForm.company || ""} onChange={e => setTmForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Depoimento</label>
                <textarea value={tmForm.content || ""} onChange={e => setTmForm(f => ({ ...f, content: e.target.value }))} rows={3} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={tmForm.active ?? true} onChange={e => setTmForm(f => ({ ...f, active: e.target.checked }))} className="accent-primary" />
                Visível na landing page
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setTestimonialModal(null)} className="flex-1">Cancelar</Button>
              <Button className="flex-1" onClick={() => {
                if (testimonialModal === "new") testimonialMutation.mutate({ method: "POST", data: tmForm });
                else testimonialMutation.mutate({ method: "PATCH", id: (testimonialModal as Testimonial).id, data: tmForm });
              }}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {faqModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setFaqModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{faqModal === "new" ? "Nova Pergunta" : "Editar Pergunta"}</h2>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground mb-1 block">Pergunta</label><Input value={faqForm.question || ""} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Resposta</label>
                <textarea value={faqForm.answer || ""} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={4} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={faqForm.active ?? true} onChange={e => setFaqForm(f => ({ ...f, active: e.target.checked }))} className="accent-primary" />
                Visível na landing page
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setFaqModal(null)} className="flex-1">Cancelar</Button>
              <Button className="flex-1" onClick={() => {
                if (faqModal === "new") faqMutation.mutate({ method: "POST", data: faqForm });
                else faqMutation.mutate({ method: "PATCH", id: (faqModal as Faq).id, data: faqForm });
              }}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {benefitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setBenefitModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{benefitModal === "new" ? "Novo Benefício" : "Editar Benefício"}</h2>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground mb-1 block">Emoji/Ícone</label><Input value={benForm.icon || "✅"} onChange={e => setBenForm(f => ({ ...f, icon: e.target.value }))} placeholder="✅" className="w-24" /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Título</label><Input value={benForm.title || ""} onChange={e => setBenForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                <textarea value={benForm.description || ""} onChange={e => setBenForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={benForm.active ?? true} onChange={e => setBenForm(f => ({ ...f, active: e.target.checked }))} className="accent-primary" />
                Visível na landing page
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setBenefitModal(null)} className="flex-1">Cancelar</Button>
              <Button className="flex-1" onClick={() => {
                if (benefitModal === "new") benefitMutation.mutate({ method: "POST", data: benForm });
                else benefitMutation.mutate({ method: "PATCH", id: (benefitModal as Benefit).id, data: benForm });
              }}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
