import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const POSTS = [
  {
    id: 1,
    category: "Fibra Óptica",
    categoryColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    title: "Como escolher o técnico certo para instalação de FTTH",
    excerpt: "Saiba quais certificações e habilidades avaliar ao contratar um técnico de fibra óptica para projetos FTTH residenciais e empresariais.",
    date: "15 Jun 2025",
    readTime: "5 min",
    emoji: "💡",
  },
  {
    id: 2,
    category: "Automação",
    categoryColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    title: "Tendências da Automação Industrial no Brasil em 2025",
    excerpt: "A Indústria 4.0 está transformando o mercado de field services. Veja quais tecnologias estão em alta e como se preparar.",
    date: "10 Jun 2025",
    readTime: "7 min",
    emoji: "⚙️",
  },
  {
    id: 3,
    category: "Energia Solar",
    categoryColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    title: "Por que a demanda por técnicos de energia solar está explodindo",
    excerpt: "O Brasil bate recordes em instalações fotovoltaicas. Entenda o mercado e como técnicos podem aproveitar esta oportunidade.",
    date: "5 Jun 2025",
    readTime: "4 min",
    emoji: "☀️",
  },
  {
    id: 4,
    category: "Plataforma",
    categoryColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    title: "Como a IA está mudando o field service",
    excerpt: "Matching inteligente, roteamento otimizado e predição de falhas: como a inteligência artificial está transformando o mercado.",
    date: "1 Jun 2025",
    readTime: "6 min",
    emoji: "🤖",
  },
  {
    id: 5,
    category: "Carreira",
    categoryColor: "bg-green-500/20 text-green-400 border-green-500/30",
    title: "Guia completo para técnicos autônomos aumentarem renda",
    excerpt: "Estratégias práticas para técnicos de campo conquistarem mais clientes, melhorarem sua reputação e aumentarem seus ganhos.",
    date: "28 Mai 2025",
    readTime: "8 min",
    emoji: "💰",
  },
  {
    id: 6,
    category: "CFTV",
    categoryColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    title: "CFTV IP vs Analógico: qual indicar para clientes em 2025?",
    excerpt: "Análise técnica e comercial comparando sistemas de CFTV IP e analógico, com cases reais de instalação e manutenção.",
    date: "20 Mai 2025",
    readTime: "5 min",
    emoji: "📹",
  },
];

export default function LandingBlog() {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-1.5">Blog</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Conteúdo para{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              técnicos e empresas
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Artigos técnicos, tendências de mercado e dicas práticas para você se destacar no field service.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured */}
          <div className="mb-10">
            <div className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 border border-blue-500/20 rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className={`mb-4 ${POSTS[0].categoryColor}`}>{POSTS[0].category}</Badge>
                  <h2 className="text-3xl font-bold text-white mb-4">{POSTS[0].title}</h2>
                  <p className="text-slate-400 leading-relaxed mb-6">{POSTS[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-slate-500 text-sm mb-6">
                    <span>{POSTS[0].date}</span>
                    <span>·</span>
                    <span>{POSTS[0].readTime} de leitura</span>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-white">Ler artigo →</Button>
                </div>
                <div className="text-center text-9xl opacity-30">{POSTS[0].emoji}</div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.slice(1).map((post) => (
              <div key={post.id} className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 hover:bg-slate-800 transition-all group cursor-pointer">
                <div className="h-32 bg-slate-800 flex items-center justify-center text-6xl opacity-40 group-hover:opacity-60 transition-opacity">
                  {post.emoji}
                </div>
                <div className="p-6">
                  <Badge className={`mb-3 text-xs ${post.categoryColor}`}>{post.category}</Badge>
                  <h3 className="text-white font-semibold text-base mb-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-slate-500 text-xs">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Carregar mais artigos
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Newsletter</Badge>
          <h2 className="text-3xl font-bold text-white mb-4">Fique por dentro do mercado</h2>
          <p className="text-slate-400 mb-8">Receba artigos e tendências de field service toda semana no seu e-mail.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary text-sm"
            />
            <Button className="bg-primary hover:bg-primary/90 text-white px-6 rounded-xl whitespace-nowrap">
              Assinar grátis
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/20 via-slate-950 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Comece a usar a Nexora Field</h2>
          <p className="text-slate-400 mb-8">Junte-se a mais de 50.000 técnicos e 5.000 empresas.</p>
          <a href="/app/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-xl">
              Criar Conta Grátis
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
