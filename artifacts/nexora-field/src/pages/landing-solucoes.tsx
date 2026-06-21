import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SOLUTIONS = [
  {
    id: "telecom",
    icon: "📡",
    title: "Telecom",
    subtitle: "Telecomunicações",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    desc: "Soluções completas em telecomunicações para empresas de todos os portes.",
    skills: ["PABX & VoIP", "Rádio Enlace", "ISP & Provedores", "Backhaul", "Telefonia IP", "Sistemas de Comunicação"],
    demand: "Alta demanda",
  },
  {
    id: "fibra",
    icon: "💡",
    title: "Fibra Óptica",
    subtitle: "Redes de Fibra",
    color: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    desc: "Instalação, fusão, certificação e manutenção de redes de fibra óptica.",
    skills: ["Fusão de Fibra", "OTDR", "FTTH/FTTB", "Splitters", "Certificação Óptica", "OLT/ONU"],
    demand: "Altíssima demanda",
  },
  {
    id: "ti",
    icon: "💻",
    title: "Infraestrutura TI",
    subtitle: "Suporte e Redes Corporativas",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    desc: "Suporte técnico, manutenção de servidores e redes corporativas.",
    skills: ["Help Desk", "Windows Server", "Linux", "Active Directory", "Microsoft 365", "Redes Corporativas"],
    demand: "Alta demanda",
  },
  {
    id: "redes",
    icon: "🔗",
    title: "Redes",
    subtitle: "Infraestrutura de Rede",
    color: "from-indigo-500/20 to-indigo-600/10",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    desc: "Implantação e manutenção de redes cabeadas e wireless corporativas.",
    skills: ["Cabeamento Estruturado", "Wi-Fi Enterprise", "Switches & Routers", "VLAN", "SD-WAN", "Firewall"],
    demand: "Alta demanda",
  },
  {
    id: "cftv",
    icon: "📹",
    title: "CFTV",
    subtitle: "Segurança Eletrônica",
    color: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    desc: "Instalação e manutenção de sistemas de segurança eletrônica.",
    skills: ["Câmeras IP & Analógicas", "DVR & NVR", "Controle de Acesso", "Alarmes", "Biometria", "Monitoramento Remoto"],
    demand: "Demanda crescente",
  },
  {
    id: "automacao",
    icon: "⚙️",
    title: "Automação Industrial",
    subtitle: "Indústria 4.0",
    color: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    desc: "Automação de processos industriais com tecnologia de ponta.",
    skills: ["CLPs & PLCs", "SCADA & IHM", "Redes Industriais", "Instrumentação", "Inversores", "Robótica"],
    demand: "Alta demanda",
  },
  {
    id: "eletronica",
    icon: "🔌",
    title: "Eletrônica",
    subtitle: "Manutenção Eletrônica",
    color: "from-red-500/20 to-red-600/10",
    border: "border-red-500/30",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    desc: "Diagnóstico e reparo de equipamentos eletrônicos e sistemas embarcados.",
    skills: ["Bancada Eletrônica", "Reparo de Placas", "Solda SMD", "Equipamentos Médicos", "UPS & Nobreaks", "Fontes"],
    demand: "Demanda estável",
  },
  {
    id: "solar",
    icon: "☀️",
    title: "Energia Solar",
    subtitle: "Fotovoltaico",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    desc: "Instalação, comissionamento e manutenção de sistemas fotovoltaicos.",
    skills: ["Instalação Fotovoltaica", "Inversores String & Micro", "String Box", "Manutenção Preventiva", "Monitoramento", "Off-Grid"],
    demand: "Altíssima demanda",
  },
  {
    id: "cloud",
    icon: "☁️",
    title: "Cloud & DevOps",
    subtitle: "Nuvem e Infraestrutura",
    color: "from-sky-500/20 to-sky-600/10",
    border: "border-sky-500/30",
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    desc: "Migração, otimização e suporte a ambientes em nuvem.",
    skills: ["AWS", "Azure", "Google Cloud", "Kubernetes", "Docker", "CI/CD"],
    demand: "Alta demanda",
  },
];

export default function Solucoes() {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-1.5">Soluções</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Especialidades técnicas{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              para todo mercado
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A Nexora Field cobre as principais especialidades técnicas do mercado, com milhares de profissionais verificados prontos para atender sua demanda.
          </p>
        </div>
      </section>

      {/* Grid de Soluções */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {SOLUTIONS.map((sol) => (
              <div
                key={sol.id}
                id={sol.id}
                className={`bg-gradient-to-br ${sol.color} border ${sol.border} rounded-2xl p-7 scroll-mt-24 hover:scale-[1.01] transition-all`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="text-4xl">{sol.icon}</div>
                  <Badge className={`${sol.badge} text-xs`}>{sol.demand}</Badge>
                </div>
                <h3 className="text-white font-bold text-2xl mb-1">{sol.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{sol.subtitle}</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">{sol.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {sol.skills.map((skill) => (
                    <span key={skill} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
                <a href="/app/register">
                  <Button size="sm" className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white">
                    Contratar Técnico →
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Não encontrou sua especialidade?</h2>
          <p className="text-slate-400 mb-8">Entre em contato conosco. Temos técnicos em mais de 50 especialidades diferentes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Publicar Chamado</Button>
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
