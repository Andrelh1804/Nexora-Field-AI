import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = "/api";

interface Testimonial { id: number; name: string; role: string; company?: string; content: string }
interface FaqItem { id: number; question: string; answer: string }
interface Benefit { id: number; icon?: string; title: string; description: string }
interface Plan { id: number; name: string; slug: string; price: number; features: string[]; highlighted?: boolean }

function useLanding() {
  const settings = useQuery<Record<string, string>>({
    queryKey: ["landing-settings"],
    queryFn: async () => { const r = await fetch(`${API}/landing/settings`); return r.ok ? r.json() : {}; },
    staleTime: 5 * 60 * 1000,
  });
  const testimonials = useQuery<Testimonial[]>({
    queryKey: ["landing-testimonials"],
    queryFn: async () => { const r = await fetch(`${API}/landing/testimonials`); return r.ok ? r.json() : []; },
    staleTime: 5 * 60 * 1000,
  });
  const faq = useQuery<FaqItem[]>({
    queryKey: ["landing-faq"],
    queryFn: async () => { const r = await fetch(`${API}/landing/faq`); return r.ok ? r.json() : []; },
    staleTime: 5 * 60 * 1000,
  });
  const benefits = useQuery<Benefit[]>({
    queryKey: ["landing-benefits"],
    queryFn: async () => { const r = await fetch(`${API}/landing/benefits`); return r.ok ? r.json() : []; },
    staleTime: 5 * 60 * 1000,
  });
  const plans = useQuery<Plan[]>({
    queryKey: ["plans-public"],
    queryFn: async () => { const r = await fetch(`${API}/plans`); return r.ok ? r.json() : []; },
    staleTime: 5 * 60 * 1000,
  });
  return {
    settings: settings.data ?? {},
    testimonials: testimonials.data ?? [],
    faq: faq.data ?? [],
    benefits: benefits.data ?? [],
    plans: plans.data ?? [],
  };
}

const DEFAULT_BENEFITS = [
  { id: 1, icon: "🤖", title: "IA Matching", description: "Algoritmo inteligente encontra o técnico certo para cada chamado em segundos." },
  { id: 2, icon: "📍", title: "Geolocalização", description: "Técnicos próximos ao local do serviço com rota e disponibilidade otimizados." },
  { id: 3, icon: "⭐", title: "Avaliações Verificadas", description: "Sistema de rating com histórico completo de execuções validadas." },
  { id: 4, icon: "🛡️", title: "Certificações", description: "Técnicos com certificados verificados pela plataforma Nexora." },
  { id: 5, icon: "💰", title: "Pagamento Seguro", description: "Carteira digital integrada com proteção para empresas e técnicos." },
  { id: 6, icon: "📊", title: "Dashboards em Tempo Real", description: "Acompanhe chamados, métricas e SLA em tempo real." },
];

const SPECIALTIES = [
  { icon: "📡", label: "Telecom", desc: "PABX, VoIP, rádio enlace", href: "/solucoes#telecom" },
  { icon: "💡", label: "Fibra Óptica", desc: "Fusão, OTDR, FTTH", href: "/solucoes#fibra" },
  { icon: "💻", label: "Infraestrutura TI", desc: "Help Desk, servidores, redes", href: "/solucoes#ti" },
  { icon: "📹", label: "CFTV", desc: "Câmeras, DVR, controle de acesso", href: "/solucoes#cftv" },
  { icon: "⚙️", label: "Automação Industrial", desc: "CLP, SCADA, instrumentação", href: "/solucoes#automacao" },
  { icon: "🔌", label: "Eletrônica", desc: "Bancada, equipamentos", href: "/solucoes#eletronica" },
  { icon: "☀️", label: "Energia Solar", desc: "Fotovoltaico, inversores", href: "/solucoes#solar" },
  { icon: "☁️", label: "Cloud & DevOps", desc: "AWS, Azure, containers", href: "/solucoes#cloud" },
];

const STEPS = [
  { num: "01", title: "Empresa publica chamado", desc: "Descreve o problema, localização, SLA e valor do serviço." },
  { num: "02", title: "IA seleciona técnicos", desc: "Algoritmo analisa especialidades, localização e rating para ranquear os melhores." },
  { num: "03", title: "Técnico aceita e executa", desc: "Check-in, execução com evidências fotográficas e check-out digital." },
  { num: "04", title: "Avaliação e pagamento", desc: "Empresa avalia, pagamento liberado automaticamente pela carteira Nexora." },
];

const DEFAULT_FAQ = [
  { id: 1, question: "Como funciona o matching de técnicos?", answer: "Nossa IA analisa as especialidades do técnico, localização, histórico de avaliações e disponibilidade para encontrar o melhor profissional para cada chamado." },
  { id: 2, question: "Quais especialidades a plataforma cobre?", answer: "Telecom, Fibra Óptica, TI, Redes, CFTV, Automação Industrial, Eletrônica, Energia Solar, Cloud & DevOps, Infraestrutura e muito mais." },
  { id: 3, question: "Como funciona o pagamento?", answer: "Empresas depositam na carteira Nexora ao publicar o chamado. O pagamento é liberado automaticamente ao técnico após aprovação da execução." },
  { id: 4, question: "Os técnicos precisam de certificações?", answer: "Recomendamos e valorizamos técnicos com certificações. A plataforma verifica certificados e aumenta o score do profissional no ranking." },
  { id: 5, question: "Qual o tempo médio para encontrar um técnico?", answer: "Em média menos de 2 horas para chamados em grandes centros. Técnicos disponíveis recebem notificação em tempo real." },
];

export default function Home() {
  const { settings, testimonials, faq, benefits, plans } = useLanding();

  const heroTitle = settings["hero.title"] || "Intelligent Field Services";
  const heroSubtitle = settings["hero.subtitle"] || "Conectamos empresas que precisam de suporte técnico em campo com técnicos autônomos especializados através de IA.";
  const heroCta1 = settings["hero.cta_primary"] || "Começar Agora";
  const heroCta2 = settings["hero.cta_secondary"] || "Acessar Conta";

  const displayBenefits = benefits.length > 0 ? benefits : DEFAULT_BENEFITS;
  const displayFaq = faq.length > 0 ? faq : DEFAULT_FAQ;

  const words = heroTitle.split(" ");
  const firstPart = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const secondPart = words.slice(Math.ceil(words.length / 2)).join(" ");

  return (
    <div className="text-white">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center w-full">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
            🤖 Powered by Artificial Intelligence
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            {firstPart}{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {secondPart}
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                {heroCta1}
              </Button>
            </a>
            <a href="/app/login">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm">
                {heroCta2}
              </Button>
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { value: "50k+", label: "Técnicos" },
              { value: "5k+", label: "Empresas" },
              { value: "200k+", label: "Chamados" },
              { value: "98%", label: "Satisfação" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">Vantagens</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Por que escolher a Nexora Field?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A plataforma mais completa para gestão de field services no Brasil</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBenefits.map((b) => (
              <div key={b.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-primary/30 hover:bg-slate-800 transition-all">
                <div className="text-3xl mb-4">{b.icon || "⚡"}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Processo</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Como Funciona</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Do chamado à conclusão em 4 passos simples</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
                  {step.num}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/como-funciona">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Ver detalhes completos →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">Especialidades</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Cobertura Técnica Completa</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Técnicos especializados em todas as áreas da tecnologia de campo</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {SPECIALTIES.map((s) => (
              <a key={s.label} href={s.href} className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:border-primary/40 hover:bg-slate-800 transition-all group text-center">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                <div className="text-white font-semibold text-sm mb-1">{s.label}</div>
                <div className="text-slate-500 text-xs">{s.desc}</div>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/especialidades">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Ver todas as especialidades →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Academy */}
      <section className="py-20 bg-gradient-to-br from-blue-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🎓 Academy</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Capacite-se com a Nexora Academy</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Cursos técnicos especializados, certificações reconhecidas e trilhas de aprendizado para técnicos de campo.
              </p>
              <ul className="space-y-3 mb-8">
                {["Cursos de Fibra Óptica, Telecom e Automação", "Certificação Técnico Homologado Nexora", "Ranking Academy com premiações mensais", "Manual de Boas Práticas Nexora"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className="text-green-400 shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/academy">
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">Acessar Academy →</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "📚", label: "Cursos", value: "50+" },
                { icon: "🏆", label: "Certificações", value: "12" },
                { icon: "👨‍🎓", label: "Alunos", value: "8k+" },
                { icon: "⭐", label: "Avaliação Média", value: "4.9" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      {plans.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">Planos</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Escolha seu Plano</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Para técnicos autônomos e empresas de todos os tamanhos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {plans.slice(0, 4).map((plan) => (
                <div key={plan.id} className={`relative bg-slate-800/50 border rounded-2xl p-6 flex flex-col ${plan.highlighted ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "border-white/10"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white text-xs px-3">Mais Popular</Badge>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-white">Grátis</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-400 text-sm">R$</span>
                          <span className="text-3xl font-bold text-white">{plan.price.toFixed(2).replace(".", ",")}</span>
                          <span className="text-slate-400 text-sm">/mês</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {(plan.features || []).slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5 shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/app/register">
                    <Button className={`w-full ${plan.highlighted ? "bg-primary hover:bg-primary/90" : "bg-white/10 hover:bg-white/20 border border-white/10"}`}>
                      Assinar Agora
                    </Button>
                  </a>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/planos">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Ver todos os planos →</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30">Depoimentos</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">O que dizem nossos usuários</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((t) => (
                <div key={t.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{t.name}</div>
                      <div className="text-slate-500 text-xs">{t.role}{t.company ? ` · ${t.company}` : ""}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {displayFaq.slice(0, 5).map((item) => (
              <details key={item.id} className="group bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium hover:bg-white/5 transition-colors list-none">
                  <span className="text-sm sm:text-base">{item.question}</span>
                  <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{item.answer}</div>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Ver todas as perguntas →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pronto para transformar seus field services?
          </h2>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">
            Junte-se a mais de 50.000 técnicos e 5.000 empresas que já usam a Nexora Field.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-primary/25">
                Criar Conta Grátis
              </Button>
            </a>
            <Link href="/contato">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 text-lg px-10 py-6 rounded-xl">
                Falar com Vendas
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
