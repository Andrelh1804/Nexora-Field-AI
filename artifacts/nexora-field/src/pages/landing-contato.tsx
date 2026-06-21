import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

export default function LandingContato() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "empresa", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["landing-settings"],
    queryFn: async () => { const r = await fetch(`${API}/landing/settings`); return r.ok ? r.json() : {}; },
    staleTime: 5 * 60 * 1000,
  });

  const email = settings?.["footer.email"] || "contato@nexorafield.com.br";
  const phone = settings?.["footer.phone"] || "(11) 3000-0000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-teal-500/20 text-teal-400 border-teal-500/30 px-4 py-1.5">Contato</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Fale com{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              nossa equipe
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Tire dúvidas, solicite uma demonstração ou saiba como a Nexora Field pode transformar sua operação de field service.
          </p>
        </div>
      </section>

      {/* Contato */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Como podemos ajudar?</h2>
              <div className="space-y-6 mb-10">
                {[
                  {
                    icon: "📧",
                    title: "E-mail",
                    desc: "Respondemos em até 4 horas úteis",
                    value: email,
                    href: `mailto:${email}`,
                  },
                  {
                    icon: "📞",
                    title: "Telefone / WhatsApp",
                    desc: "Seg–Sex, 8h às 18h",
                    value: phone,
                    href: `https://wa.me/55${phone.replace(/\D/g, "")}`,
                  },
                  {
                    icon: "📍",
                    title: "Endereço",
                    desc: "São Paulo, SP — Brasil",
                    value: "Av. Paulista, 1000 — Bela Vista",
                    href: undefined,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <div className="text-white font-semibold">{item.title}</div>
                      <div className="text-slate-500 text-sm">{item.desc}</div>
                      {item.href ? (
                        <a href={item.href} className="text-primary text-sm hover:underline mt-0.5 block">{item.value}</a>
                      ) : (
                        <div className="text-slate-400 text-sm mt-0.5">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-slate-800/50 border border-primary/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-2">🚀 Solicitar Demo</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Agende uma demonstração personalizada de 30 min com nosso time de vendas. Veja a plataforma em ação com dados do seu setor.
                </p>
                <a href="/app/register">
                  <Button className="bg-primary hover:bg-primary/90 text-white w-full">Agendar Demo Gratuita</Button>
                </a>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-8">
              {sent ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-white font-bold text-xl mb-2">Mensagem enviada!</h3>
                  <p className="text-slate-400 mb-6">Nossa equipe entrará em contato em até 4 horas úteis.</p>
                  <Button onClick={() => setSent(false)} variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    Enviar outra mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-white font-bold text-xl mb-2">Envie sua mensagem</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-1.5 block">Nome *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary text-sm"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-1.5 block">E-mail *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary text-sm"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-1.5 block">Telefone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary text-sm"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-1.5 block">Sou</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      >
                        <option value="empresa">Empresa</option>
                        <option value="tecnico">Técnico</option>
                        <option value="parceiro">Parceiro</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-sm mb-1.5 block">Assunto</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary text-sm"
                      placeholder="Ex: Dúvida sobre planos"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-sm mb-1.5 block">Mensagem *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary text-sm resize-none"
                      placeholder="Descreva sua dúvida ou necessidade..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 mb-4">Tem dúvidas? Confira nossas</p>
          <Link href="/faq">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Perguntas Frequentes →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
