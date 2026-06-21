import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = "/api";

interface Category { id: number; name: string; icon?: string; description?: string }
interface Subcategory { id: number; name: string; categoryId: number }

const FALLBACK_CATEGORIES = [
  { id: 1, icon: "📡", name: "Telecom", description: "Telecomunicações, PABX, VoIP, rádio enlace e redes ISP" },
  { id: 2, icon: "💡", name: "Fibra Óptica", description: "Fusão óptica, OTDR, FTTH/FTTB e certificação" },
  { id: 3, icon: "💻", name: "TI / Suporte", description: "Help Desk, servidores, redes corporativas e Microsoft 365" },
  { id: 4, icon: "🔌", name: "Eletrônica", description: "Bancada eletrônica, reparo de placas e equipamentos" },
  { id: 5, icon: "⚙️", name: "Automação Industrial", description: "CLPs, SCADA, IHM, redes industriais e instrumentação" },
  { id: 6, icon: "📹", name: "Segurança Eletrônica", description: "CFTV, controle de acesso, alarmes e monitoramento" },
  { id: 7, icon: "☀️", name: "Energia Solar", description: "Fotovoltaico, inversores e sistemas off-grid" },
  { id: 8, icon: "☁️", name: "Cloud & DevOps", description: "AWS, Azure, Kubernetes, Docker e CI/CD" },
  { id: 9, icon: "🏗️", name: "Infraestrutura", description: "Cabeamento estruturado, data center e lógica" },
];

export default function LandingEspecialidades() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["specialty-categories-public"],
    queryFn: async () => {
      const r = await fetch(`${API}/specialties/categories`);
      return r.ok ? r.json() : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-1.5">Especialidades</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Técnicos especializados em{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              todas as áreas
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Nossa plataforma conta com técnicos certificados e verificados nas principais especialidades do mercado de field service.
          </p>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCategories.map((cat) => (
              <div key={cat.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-violet-500/40 hover:bg-slate-800 transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">{cat.icon || "🔧"}</div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-slate-400 text-sm leading-relaxed mt-1">{cat.description}</p>
                    )}
                  </div>
                </div>
                <a href="/app/register">
                  <Button size="sm" variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                    Contratar especialista →
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para técnicos */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/20 rounded-3xl p-10 md:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">Sou Técnico</Badge>
                <h2 className="text-3xl font-bold text-white mb-4">Cadastre suas especialidades e comece a receber chamados</h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Informe suas habilidades, certificações e área de atuação. Nossa IA conectará você aos chamados mais compatíveis com seu perfil.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Perfil visível para milhares de empresas", "Chamados compatíveis com sua especialidade", "Sistema de ranking que valoriza os melhores", "Certificações verificadas que aumentam seu score"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                      <span className="text-green-400 shrink-0">✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a href="/app/register">
                  <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8 py-6 rounded-xl">
                    Cadastrar como Técnico
                  </Button>
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "50k+", label: "Técnicos ativos" },
                  { value: "R$8k", label: "Média mensal top técnicos" },
                  { value: "4.8★", label: "Avaliação média" },
                  { value: "2h", label: "Tempo médio para chamado" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-slate-400 text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Precisa de um técnico especializado?</h2>
          <p className="text-slate-400 mb-8">Publique um chamado e nossa IA encontra o técnico certo em minutos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/app/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Publicar Chamado</Button>
            </a>
            <Link href="/solucoes">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-xl">Ver Soluções</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
