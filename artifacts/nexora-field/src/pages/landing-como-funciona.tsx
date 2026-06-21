import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COMPANY_STEPS = [
  {
    num: "01",
    icon: "📝",
    title: "Cadastro da Empresa",
    desc: "Crie sua conta, configure o perfil da empresa e adicione métodos de pagamento à carteira Nexora.",
  },
  {
    num: "02",
    icon: "📋",
    title: "Publicação do Chamado",
    desc: "Descreva o problema técnico, informe a localização, o SLA desejado, o valor do serviço e requisitos específicos.",
  },
  {
    num: "03",
    icon: "🤖",
    title: "IA Faz o Matching",
    desc: "Nosso algoritmo analisa especialidades, geolocalização, avaliações e disponibilidade para ranquear os melhores técnicos.",
  },
  {
    num: "04",
    icon: "✅",
    title: "Técnico Aceita",
    desc: "O técnico recebe a notificação, analisa o chamado e aceita. Você acompanha em tempo real pelo dashboard.",
  },
  {
    num: "05",
    icon: "🔧",
    title: "Execução com Evidências",
    desc: "O técnico faz check-in no local, executa o serviço e registra evidências fotográficas e relatório técnico.",
  },
  {
    num: "06",
    icon: "💰",
    title: "Aprovação e Pagamento",
    desc: "Você aprova a execução, avalia o técnico e o pagamento é liberado automaticamente da carteira Nexora.",
  },
];

const TECH_STEPS = [
  {
    num: "01",
    icon: "👤",
    title: "Cadastro do Técnico",
    desc: "Crie seu perfil, informe suas especialidades, área de atuação, disponibilidade e faça upload das certificações.",
  },
  {
    num: "02",
    icon: "🔔",
    title: "Receba Chamados",
    desc: "Seja notificado em tempo real sobre chamados compatíveis com suas especialidades e próximos à sua localização.",
  },
  {
    num: "03",
    icon: "✋",
    title: "Aceite e Execute",
    desc: "Analise os detalhes, aceite o chamado, faça check-in no local e execute o serviço com qualidade.",
  },
  {
    num: "04",
    icon: "📸",
    title: "Documente o Serviço",
    desc: "Registre evidências fotográficas, preencha o relatório técnico e faça check-out ao finalizar.",
  },
  {
    num: "05",
    icon: "⭐",
    title: "Receba a Avaliação",
    desc: "Após aprovação da empresa, você recebe sua avaliação. Boas avaliações aumentam seu ranking e visibilidade.",
  },
  {
    num: "06",
    icon: "💳",
    title: "Receba o Pagamento",
    desc: "O valor é creditado automaticamente na sua carteira Nexora. Saque quando quiser via PIX ou transferência.",
  },
];

export default function ComoFunciona() {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-4 py-1.5">Como Funciona</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Do chamado à conclusão,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              simples e transparente
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A Nexora Field elimina a complexidade do field service. Veja como funciona para empresas e técnicos.
          </p>
        </div>
      </section>

      {/* Para Empresas */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">Para Empresas</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Contrate técnicos em minutos</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Sem burocracia, sem planilhas, sem risco. Serviço técnico de qualidade com SLA garantido.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPANY_STEPS.map((step) => (
              <div key={step.num} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">{step.num}</div>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Começar como Empresa</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Para Técnicos */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">Para Técnicos</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Ganhe mais com suas habilidades</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Trabalhe quando e onde quiser, receba pelo seu valor e construa uma reputação sólida no mercado.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TECH_STEPS.map((step) => (
              <div key={step.num} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-green-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">{step.num}</div>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/app/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8 py-6 rounded-xl">Cadastrar como Técnico</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Recursos da Plataforma */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">Recursos</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Tudo que você precisa em um só lugar</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🗺️", label: "Mapa em Tempo Real" },
              { icon: "🤖", label: "Copiloto IA" },
              { icon: "👁️", label: "Visão Computacional" },
              { icon: "📊", label: "Relatórios Completos" },
              { icon: "🏆", label: "Ranking Gamificado" },
              { icon: "🎓", label: "Academy Integrada" },
              { icon: "💬", label: "CRM Integrado" },
              { icon: "📱", label: "App Mobile" },
            ].map((f) => (
              <div key={f.label} className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-center hover:border-primary/30 transition-all">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-slate-300 text-xs font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Pronto para começar?</h2>
          <p className="text-slate-400 mb-8">Crie sua conta gratuitamente e experimente a plataforma por 14 dias sem compromisso.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Criar Conta Grátis</Button>
            </a>
            <Link href="/planos">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-xl">Ver Planos</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
