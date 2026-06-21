import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Sobre() {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">Sobre Nós</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            A empresa que está{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              reinventando o Field Service
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed">
            A Nexora Field AI é um marketplace B2B que conecta empresas que precisam de suporte técnico em campo com técnicos autônomos especializados, utilizando inteligência artificial para garantir o match perfeito.
          </p>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Missão",
                desc: "Democratizar o acesso a serviços técnicos de qualidade, conectando empresas a profissionais especializados de forma rápida, transparente e eficiente.",
              },
              {
                icon: "🔭",
                title: "Visão",
                desc: "Ser a maior plataforma de Field Service da América Latina, reconhecida pela excelência técnica e inovação impulsionada por inteligência artificial.",
              },
              {
                icon: "💎",
                title: "Valores",
                desc: "Transparência, excelência técnica, inovação contínua, respeito ao profissional e foco total na experiência do cliente.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossa história */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">Nossa História</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Nascemos para resolver um problema real</h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  A Nexora Field nasceu da frustração de empreendedores que enfrentavam dificuldade em encontrar técnicos qualificados para serviços de campo. O processo era lento, caro e sem nenhuma transparência.
                </p>
                <p>
                  Em 2023, reunimos especialistas em tecnologia, operações de field service e inteligência artificial para criar a solução definitiva: uma plataforma que usa IA para fazer o match perfeito entre demanda e oferta técnica.
                </p>
                <p>
                  Hoje, somos a plataforma de field services mais completa do Brasil, com mais de 50.000 técnicos cadastrados e 5.000 empresas atendidas em todo o território nacional.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "2023", label: "Fundação" },
                { value: "50k+", label: "Técnicos" },
                { value: "5k+", label: "Empresas" },
                { value: "27", label: "Estados cobertos" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">Diferenciais</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Por que somos diferentes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🤖", title: "IA Proprietária", desc: "Algoritmo de matching desenvolvido internamente, treinado com dados de milhares de execuções reais de field service." },
              { icon: "✅", title: "Técnicos Verificados", desc: "Processo rigoroso de verificação de identidade, certificações e histórico profissional para todos os técnicos." },
              { icon: "📱", title: "Plataforma Completa", desc: "Do chamado ao pagamento, tudo dentro da Nexora. Sem planilhas, sem WhatsApp, sem papel." },
              { icon: "🏆", title: "Gamificação", desc: "Sistema de ranking e premiações que incentiva a excelência e reconhece os melhores profissionais." },
            ].map((d) => (
              <div key={d.title} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="text-3xl shrink-0">{d.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{d.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Faça parte da revolução do Field Service</h2>
          <p className="text-slate-400 mb-8">Seja técnico ou empresa, a Nexora Field tem um plano para você.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Criar Conta Grátis</Button>
            </a>
            <Link href="/contato">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-xl">Falar Conosco</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
