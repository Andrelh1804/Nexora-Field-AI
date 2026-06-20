import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, CheckCircle2, ChevronRight, Menu, X, 
  MapPin, Clock, FileText, Smartphone, MessageSquare, 
  LayoutDashboard, ShieldCheck, Zap, Bot, Users, 
  TrendingUp, Activity, BarChart, Server, Wrench, 
  Wifi, Camera, Sun, Building2, HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("nexora_token");
    setHasSession(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/nexora-logo.png" alt="Nexora Field AI" className="h-8 md:h-10 w-auto" />
          </a>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#solucao" className="hover:text-white transition-colors">Solução</a>
            <a href="#ia" className="hover:text-white transition-colors">Inteligência Artificial</a>
            <a href="#mercados" className="hover:text-white transition-colors">Mercados</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </nav>
          
          <div className="hidden lg:flex items-center gap-4">
            {hasSession ? (
              <a href="/dashboard">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_20px_rgba(142,219,101,0.4)] flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-secondary-foreground/70 animate-pulse"></span>
                  Acessar Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <>
                <a href="/login"><Button variant="ghost" className="text-white hover:bg-white/10">Login</Button></a>
                <a href="/register"><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_20px_rgba(142,219,101,0.3)]">
                  Solicitar Demonstração
                </Button></a>
              </>
            )}
          </div>
          
          <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Session Banner */}
      <AnimatePresence>
        {hasSession && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="fixed top-[60px] md:top-[76px] left-0 w-full z-40 flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-3 bg-secondary/10 border border-secondary/30 backdrop-blur-md rounded-full px-5 py-2.5 shadow-[0_4px_24px_rgba(142,219,101,0.15)]">
              <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse shrink-0"></span>
              <span className="text-sm text-white/90">Você já tem uma sessão ativa.</span>
              <a href="/dashboard" className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1">
                Acessar Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[60px] md:top-[68px] left-0 w-full bg-background border-b border-white/10 z-40 lg:hidden overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              <a href="#solucao" className="text-muted-foreground hover:text-white p-2" onClick={() => setMobileMenuOpen(false)}>Solução</a>
              <a href="#ia" className="text-muted-foreground hover:text-white p-2" onClick={() => setMobileMenuOpen(false)}>Inteligência Artificial</a>
              <a href="#mercados" className="text-muted-foreground hover:text-white p-2" onClick={() => setMobileMenuOpen(false)}>Mercados</a>
              <a href="#planos" className="text-muted-foreground hover:text-white p-2" onClick={() => setMobileMenuOpen(false)}>Planos</a>
              <div className="h-px bg-white/10 my-2"></div>
              {hasSession ? (
                <a href="/dashboard" className="w-full">
                  <Button className="w-full justify-center bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-secondary-foreground/70 animate-pulse"></span>
                    Acessar Dashboard
                  </Button>
                </a>
              ) : (
                <>
                  <a href="/login" className="w-full"><Button variant="outline" className="w-full justify-center border-white/20">Login</Button></a>
                  <a href="/register" className="w-full"><Button className="w-full justify-center bg-secondary text-secondary-foreground hover:bg-secondary/90">Solicitar Demonstração</Button></a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="max-w-2xl"
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
                  <span className="text-xs font-medium text-white/80">O Sistema Operacional para Serviços de Campo</span>
                </motion.div>
                
                <motion.div variants={fadeIn} className="mb-8">
                  <img src="/nexora-logo.png" alt="Nexora" className="h-16 md:h-20 w-auto mb-6" />
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                    A Plataforma Inteligente que Conecta Empresas aos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Melhores Técnicos de Campo</span>
                  </h1>
                </motion.div>
                
                <motion.p variants={fadeIn} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Automatize a contratação, gestão e execução de serviços técnicos com Inteligência Artificial. Encontre profissionais qualificados em telecom, fibra óptica, infraestrutura de TI, automação industrial, CFTV e manutenção em minutos.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 mb-12">
                  <a href="/register">
                    <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base h-14 px-8 shadow-[0_0_30px_rgba(142,219,101,0.2)]">
                      Solicitar Demonstração
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                  <a href="/register?role=technician">
                    <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 text-base h-14 px-8">
                      Sou Técnico
                    </Button>
                  </a>
                </motion.div>
                
                <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">+50k</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Técnicos Especializados</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">+10k</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Empresas Conectadas</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">+1M</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Chamados Gerenciados</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-secondary mb-1">99,9%</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Disponibilidade</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative lg:h-[600px] flex items-center justify-center lg:justify-end"
              >
                {/* Hero Dashboard UI Mockup */}
                <div className="glass-panel w-full max-w-[600px] rounded-2xl overflow-hidden flex flex-col relative z-20 transform lg:rotate-[-2deg] lg:translate-y-4 hover:rotate-0 transition-transform duration-500">
                  {/* Window Controls */}
                  <div className="h-10 bg-black/40 flex items-center px-4 gap-2 border-b border-white/5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary/80"></div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-5 flex flex-col gap-4 bg-gradient-to-br from-[#1B2942] to-[#121c2e]">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-white font-semibold text-lg">Visão Geral da Operação</h3>
                        <p className="text-xs text-muted-foreground">Atualizado agora</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Activity size={16} />
                      </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-muted-foreground mb-1">Atendimentos Hoje</p>
                        <p className="text-xl font-bold text-white">248</p>
                        <p className="text-[10px] text-secondary flex items-center mt-1"><TrendingUp size={10} className="mr-1"/> +12%</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-muted-foreground mb-1">Técnicos Online</p>
                        <p className="text-xl font-bold text-white">1,452</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Disponíveis agora</p>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                        <p className="text-xs text-primary/80 mb-1">Match Rate (IA)</p>
                        <p className="text-xl font-bold text-primary">94%</p>
                        <p className="text-[10px] text-primary/60 mt-1">Acima da média</p>
                      </div>
                    </div>

                    {/* Map Mockup */}
                    <div className="h-40 rounded-lg bg-[#0e1624] relative overflow-hidden border border-white/5 flex items-center justify-center group">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230A84FF\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                      
                      {/* Fake Map Markers */}
                      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_#8EDB65] animate-pulse"></div>
                      <div className="absolute top-1/2 left-2/3 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#0A84FF] animate-pulse" style={{ animationDelay: "0.5s"}}></div>
                      <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" style={{ animationDelay: "1s"}}></div>
                      <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_#8EDB65] animate-pulse" style={{ animationDelay: "1.5s"}}></div>
                      
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-white/10 z-10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        Monitoramento em Tempo Real
                      </div>
                    </div>

                    {/* Recent Orders List */}
                    <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                      <div className="p-3 border-b border-white/5 flex justify-between items-center">
                        <p className="text-sm font-medium text-white">Chamados Recentes</p>
                        <p className="text-xs text-primary cursor-pointer hover:underline">Ver todos</p>
                      </div>
                      <div className="divide-y divide-white/5">
                        {[
                          { id: "OS-4921", status: "Em Rota", type: "Fibra Óptica", tech: "Carlos S.", time: "10 min" },
                          { id: "OS-4920", status: "Em Atendimento", type: "CFTV", tech: "Mariana L.", time: "45 min" },
                          { id: "OS-4919", status: "Concluído", type: "Telecom", tech: "Rafael M.", time: "2 horas", done: true }
                        ].map((order, i) => (
                          <div key={i} className="p-3 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-black/30 ${order.done ? "text-secondary" : "text-primary"}`}>
                                {order.done ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-white">{order.id} • {order.type}</p>
                                <p className="text-[10px] text-muted-foreground">Téc: {order.tech}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 inline-block ${order.done ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"}`}>
                                {order.status}
                              </p>
                              <p className="text-[10px] text-muted-foreground block">{order.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-6 lg:-right-12 top-1/4 glass-panel p-4 rounded-xl flex items-center gap-3 z-30"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Técnico Encontrado</p>
                    <p className="text-xs text-muted-foreground">Match IA: 98% de afinidade</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 10, 0] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-6 lg:-left-12 bottom-1/4 glass-panel p-4 rounded-xl flex items-center gap-3 z-30"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">SLA Garantido</p>
                    <p className="text-xs text-muted-foreground">Relatório automático gerado</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* LOGOS / SOCIAL PROOF */}
        <section className="py-10 border-y border-white/5 bg-white/[0.01]">
          <div className="container mx-auto px-4 md:px-8">
            <p className="text-center text-sm text-muted-foreground mb-8">Empresas que já transformaram suas operações</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Using generic placeholders for logos, in real life these would be real company SVGs */}
              <div className="text-xl font-bold font-serif italic tracking-tighter">Acme Corp</div>
              <div className="text-xl font-black tracking-widest">GLOBAL<span className="text-primary">NET</span></div>
              <div className="text-2xl font-bold flex items-center gap-1"><Zap size={20} /> EnergyX</div>
              <div className="text-xl font-medium tracking-wide">FIBERLINK</div>
              <div className="text-lg font-bold border-2 border-current px-2 py-1">TECH<span className="opacity-50">INFRA</span></div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Sua operação ainda depende de planilhas, grupos de WhatsApp e processos manuais?</h2>
              <p className="text-lg text-muted-foreground">Empresas perdem tempo e dinheiro tentando localizar profissionais qualificados para executar serviços em campo. A falta de padrão destrói margens.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Dificuldade para encontrar técnicos", icon: <Users size={24} /> },
                { title: "Falta de controle operacional", icon: <LayoutDashboard size={24} /> },
                { title: "SLA sem monitoramento", icon: <Clock size={24} /> },
                { title: "Relatórios inconsistentes", icon: <FileText size={24} /> },
                { title: "Alto custo operacional", icon: <TrendingUp size={24} className="rotate-180" /> },
                { title: "Pouca visibilidade sobre resultados", icon: <Activity size={24} /> }
              ].map((problem, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {problem.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground">A complexidade não precisa ser a regra. É hora de substituir o caos por visibilidade total.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section id="solucao" className="py-24 relative bg-primary/5 border-y border-white/5">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-6">
                  A Solução Definitiva
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">Conheça a Nexora Field AI</h2>
                <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                  A primeira plataforma brasileira que combina Marketplace de Técnicos, Gestão Operacional e Inteligência Artificial em uma única solução integrada e escalável.
                </p>

                <div className="grid sm:grid-cols-2 gap-y-8 gap-x-6">
                  {[
                    { title: "Match Inteligente por IA", icon: <Bot size={20} /> },
                    { title: "Geolocalização em Tempo Real", icon: <MapPin size={20} /> },
                    { title: "Gestão de Chamados", icon: <LayoutDashboard size={20} /> },
                    { title: "Relatórios Automáticos", icon: <FileText size={20} /> },
                    { title: "Aplicativo Android e iOS", icon: <Smartphone size={20} /> },
                    { title: "WhatsApp Integrado", icon: <MessageSquare size={20} /> },
                    { title: "Dashboard Executivo", icon: <BarChart size={20} /> },
                    { title: "Controle de SLA", icon: <Clock size={20} /> }
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 text-primary">{feature.icon}</div>
                      <p className="font-medium text-white/90">{feature.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full"></div>
                <div className="relative glass-card rounded-2xl p-6 md:p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h4 className="text-white font-semibold">Match IA de Técnico</h4>
                        <p className="text-xs text-muted-foreground">Buscando o melhor perfil para OS-8942</p>
                      </div>
                      <span className="animate-pulse flex h-3 w-3 rounded-full bg-secondary"></span>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { name: "Roberto Silva", skill: "Fibra Óptica Sênior", dist: "2.4 km", rating: "4.9", match: "98%" },
                        { name: "Amanda Costa", skill: "Telecom Pleno", dist: "3.1 km", rating: "4.8", match: "92%" },
                        { name: "Diego Santos", skill: "Infraestrutura TI", dist: "5.5 km", rating: "4.7", match: "85%" }
                      ].map((tech, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                              {tech.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{tech.name}</p>
                              <p className="text-[10px] text-muted-foreground">{tech.skill} • {tech.dist}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-secondary text-xs font-bold bg-secondary/10 px-2 py-0.5 rounded flex items-center gap-1">
                              <Bot size={10} /> {tech.match}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">★ {tech.rating}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <a href="/chamados/novo" className="w-full block">
                      <Button className="w-full bg-primary text-white hover:bg-primary/90 mt-2">
                        Despachar Automaticamente
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simples. Rápido. Inteligente.</h2>
              <p className="text-lg text-muted-foreground">Como o sistema operacional de campo revoluciona sua rotina.</p>
            </div>

            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent -translate-y-1/2 z-0"></div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-2 relative z-10">
                {[
                  { step: 1, title: "Empresa cria chamado", desc: "Via sistema ou API" },
                  { step: 2, title: "IA identifica técnicos", desc: "Match por skill e local" },
                  { step: 3, title: "Técnico aceita serviço", desc: "Pelo app Nexora" },
                  { step: 4, title: "Atendimento executado", desc: "Com geolocalização" },
                  { step: 5, title: "IA gera relatório", desc: "Análise de fotos e dados" },
                  { step: 6, title: "Pagamento liberado", desc: "Processo automático" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4 shadow-lg transition-transform group-hover:scale-110 ${i === 5 ? "bg-secondary text-secondary-foreground" : "bg-[#1B2942] border-2 border-primary text-white"}`}>
                      {item.step}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI SECTION */}
        <section id="ia" className="py-24 bg-[#121c2e] relative border-y border-white/5 overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Inteligência Artificial Aplicada à Operação
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">Não somos apenas um software. Somos seu co-piloto operacional capaz de analisar, decidir e documentar.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "AI Match", desc: "Identifica automaticamente os profissionais mais qualificados com base em histórico, skills, distância e avaliações.", icon: <Bot /> },
                { title: "AI Dispatcher", desc: "Distribui chamados de forma automática e otimizada, criando as melhores rotas e evitando ociosidade.", icon: <Zap /> },
                { title: "AI Vision", desc: "Analisa fotos enviadas pelos técnicos para identificar equipamentos, padrões de instalação e possíveis falhas antes de fechar o chamado.", icon: <Camera /> },
                { title: "AI Reports", desc: "Gera relatórios técnicos completos, estruturados e em linguagem profissional em segundos a partir de anotações soltas.", icon: <FileText /> },
                { title: "AI Copilot", desc: "Assistente especializado via chat para técnicos tirarem dúvidas em campo e gestores consultarem dados operacionais.", icon: <MessageSquare /> }
              ].map((module, i) => (
                <div key={i} className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                    {module.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{module.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{module.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEGMENTS */}
        <section id="mercados" className="py-24">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Soluções para diversos mercados</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Telecom", icon: <Wifi /> },
                { name: "Provedores de Internet", icon: <Server /> },
                { name: "Infraestrutura de TI", icon: <HardDrive /> },
                { name: "Automação Industrial", icon: <Wrench /> },
                { name: "Energia Solar", icon: <Sun /> },
                { name: "CFTV e Segurança", icon: <Camera /> },
                { name: "Datacenters", icon: <DatabaseIcon /> },
                { name: "Órgãos Públicos", icon: <Building2 /> }
              ].map((segment, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="text-muted-foreground group-hover:text-white transition-colors mb-3">
                    {segment.icon}
                  </div>
                  <p className="font-medium text-white/80 group-hover:text-white">{segment.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS & DASHBOARD */}
        <section className="py-24 relative bg-primary/5 border-y border-white/5">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Gestão Completa em um Único Painel</h2>
              <p className="text-lg text-muted-foreground">Tudo o que você precisa para escalar sua operação de campo.</p>
            </div>

            {/* Huge Dashboard Image Mockup */}
            <div className="glass-panel p-2 rounded-2xl max-w-5xl mx-auto mb-24 overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="bg-[#0e1624] rounded-xl overflow-hidden aspect-video relative flex flex-col">
                {/* Header Mockup */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
                  <div className="flex gap-4 items-center">
                    <img src="/nexora-logo.png" alt="Logo" className="h-6 opacity-80" />
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <span className="text-sm font-medium text-white">Dashboard Executivo</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-64 bg-white/5 rounded-md border border-white/5"></div>
                    <div className="h-8 w-8 rounded-full bg-primary/20"></div>
                  </div>
                </div>
                
                {/* Body Mockup */}
                <div className="flex-1 p-6 flex gap-6">
                  {/* Sidebar */}
                  <div className="w-48 space-y-2 hidden md:block">
                    {['Visão Geral', 'Chamados', 'Mapa Operacional', 'Técnicos', 'Relatórios IA', 'Financeiro'].map((item, i) => (
                      <div key={i} className={`h-10 rounded-lg flex items-center px-3 text-sm ${i === 0 ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  {/* Main content */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                          <div className="w-20 h-3 bg-white/10 rounded"></div>
                          <div className="w-12 h-6 bg-white/80 rounded"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex-1 flex gap-6">
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col">
                        <div className="w-32 h-4 bg-white/10 rounded mb-6"></div>
                        {/* Chart Mockup */}
                        <div className="flex-1 flex items-end justify-between px-4 pb-2 gap-2">
                          {[40, 60, 45, 80, 50, 70, 90, 65].map((h, i) => (
                            <div key={i} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }}>
                              <div className="w-full bg-primary rounded-t-sm" style={{ height: `${h * 0.7}%` }}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="w-1/3 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                         <div className="w-24 h-4 bg-white/10 rounded mb-2"></div>
                         {[1, 2, 3, 4, 5].map(i => (
                           <div key={i} className="h-12 bg-black/20 rounded-lg border border-white/5 flex items-center px-3 gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/10"></div>
                             <div className="flex-1">
                               <div className="w-20 h-2 bg-white/40 rounded mb-2"></div>
                               <div className="w-16 h-2 bg-white/10 rounded"></div>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Building2 className="text-primary" /> Para Empresas
                </h3>
                <ul className="space-y-4">
                  {[
                    "Redução de custos operacionais drástica",
                    "Maior velocidade de atendimento e SLA",
                    "Controle total e rastreabilidade dos chamados",
                    "Gestão de SLA em tempo real",
                    "Relatórios automáticos pós-serviço",
                    "Indicadores operacionais precisos"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-primary mt-1 shrink-0" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Wrench className="text-secondary" /> Para Técnicos
                </h3>
                <ul className="space-y-4">
                  {[
                    "Mais oportunidades de trabalho diárias",
                    "Pagamentos organizados e garantidos",
                    "Visibilidade nacional para grandes contas",
                    "Certificações e validação de skills",
                    "Aplicativo completo para gestão da rotina",
                    "Ranking profissional com bonificações"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-secondary mt-1 shrink-0" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="planos" className="py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Planos que escalam com você</h2>
              <p className="text-lg text-muted-foreground">Escolha o plano ideal para o tamanho da sua operação.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Starter */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">R$ 199</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 h-10">Para pequenas operações iniciando digitalização.</p>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-white/80">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Até 20 chamados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Dashboard básico</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Suporte padrão</li>
                </ul>
                <a href="/register" className="w-full block"><Button variant="outline" className="w-full border-white/20 hover:bg-white/5">Assinar Starter</Button></a>
              </div>

              {/* Professional */}
              <div className="bg-gradient-to-b from-[#1B2942] to-background border-2 border-primary p-6 rounded-2xl flex flex-col relative transform lg:-translate-y-4 shadow-[0_0_30px_rgba(10,132,255,0.15)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Mais Popular
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">R$ 599</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 h-10">O equilíbrio perfeito para operações em crescimento.</p>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-white/90">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Até 100 chamados</li>
                  <li className="flex items-center gap-2 font-medium text-white"><Bot size={16} className="text-primary" /> IA Match de Técnicos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> WhatsApp Integrado</li>
                  <li className="flex items-center gap-2 font-medium text-white"><FileText size={16} className="text-primary" /> Relatórios gerados por IA</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Dashboard completo</li>
                </ul>
                <a href="/register" className="w-full block"><Button className="w-full bg-primary text-white hover:bg-primary/90">Assinar Professional</Button></a>
              </div>

              {/* Business */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-2">Business</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">R$ 1.499</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 h-10">Para operações maduras que precisam de automação total.</p>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-white/80">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Chamados ilimitados</li>
                  <li className="flex items-center gap-2 text-white"><Camera size={16} className="text-white/50" /> IA Vision Analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Dashboard avançado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Acesso à API</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> White Label básico</li>
                </ul>
                <a href="/register" className="w-full block"><Button variant="outline" className="w-full border-white/20 hover:bg-white/5">Assinar Business</Button></a>
              </div>

              {/* Enterprise */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">Sob consulta</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 h-10">Arquitetura dedicada para grandes corporações.</p>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-white/80">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Multiempresa</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> White Label completo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> SSO / SAML</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> SLA corporativo customizado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/50" /> Suporte dedicado (CSM)</li>
                </ul>
                <a href="/register" className="w-full block"><Button variant="outline" className="w-full border-white/20 hover:bg-white/5">Falar com Vendas</Button></a>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-[#121c2e] border-y border-white/5">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="glass-panel p-8 rounded-2xl relative">
                <div className="text-4xl text-primary opacity-20 absolute top-4 left-6 font-serif">"</div>
                <p className="text-lg text-white mb-6 relative z-10 font-medium">A Nexora reduziu nosso tempo de contratação de técnicos em mais de 70%. O que antes levava dias de ligações e negociações, agora a IA resolve em minutos com garantia de qualidade.</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white">R</div>
                  <div>
                    <p className="font-semibold text-white">Rodrigo Mendes</p>
                    <p className="text-sm text-muted-foreground">Diretor de Operações, TelecomX</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel p-8 rounded-2xl relative">
                <div className="text-4xl text-primary opacity-20 absolute top-4 left-6 font-serif">"</div>
                <p className="text-lg text-white mb-6 relative z-10 font-medium">A plataforma transformou nossa gestão de serviços de campo. Os relatórios gerados por IA eliminaram a dor de cabeça no fechamento dos serviços. O SLA melhorou absurdamente.</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white">J</div>
                  <div>
                    <p className="font-semibold text-white">Juliana Costa</p>
                    <p className="text-sm text-muted-foreground">Gerente de Infraestrutura, NeoData</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10"></div>
          <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Pronto para modernizar sua operação?</h2>
            <p className="text-xl text-muted-foreground mb-10">Conecte sua empresa à maior rede inteligente de técnicos especializados do Brasil e recupere o controle sobre seu campo.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base h-14 px-8 shadow-[0_0_30px_rgba(142,219,101,0.2)]">
                  Solicitar Demonstração
                </Button>
              </a>
              <a href="/register">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 text-base h-14 px-8">
                  Falar com Especialista
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0e1624] border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-12 md:gap-8 mb-12">
            <div className="md:col-span-2">
              <img src="/nexora-logo.png" alt="Nexora" className="h-10 w-auto mb-6" />
              <p className="text-lg font-medium text-white mb-2">Conecta. Resolve. Impulsiona.</p>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Marketplace Inteligente de Serviços Técnicos. O sistema operacional definitivo para operações em campo no Brasil.
              </p>
              <div className="space-y-1 text-sm">
                <a href="mailto:contato@nexorafield.com.br" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <span className="text-primary/60">✉</span> contato@nexorafield.com.br
                </a>
                <a href="mailto:comercial@nexorafield.com.br" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <span className="text-primary/60">✉</span> comercial@nexorafield.com.br
                </a>
                <a href="mailto:suporte@nexorafield.com.br" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <span className="text-primary/60">✉</span> suporte@nexorafield.com.br
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/register" className="hover:text-primary transition-colors">Para Empresas</a></li>
                <li><a href="/register?role=technician" className="hover:text-primary transition-colors">Para Técnicos</a></li>
                <li><a href="#planos" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
                <li><a href="/developer" className="hover:text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://nexorafield.com.br" className="hover:text-primary transition-colors">nexorafield.com.br</a>
                </li>
                <li>
                  <a href="mailto:comercial@nexorafield.com.br" className="hover:text-primary transition-colors">Comercial</a>
                </li>
                <li>
                  <a href="mailto:suporte@nexorafield.com.br" className="hover:text-primary transition-colors">Suporte</a>
                </li>
                <li>
                  <a href="mailto:financeiro@nexorafield.com.br" className="hover:text-primary transition-colors">Financeiro</a>
                </li>
                <li><a href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="/termos" className="hover:text-primary transition-colors">Termos de Uso (LGPD)</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-2">
            <p>&copy; {new Date().getFullYear()} Nexora Field AI · Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="https://nexorafield.com.br" className="hover:text-primary transition-colors">nexorafield.com.br</a>
              <span>·</span>
              <span>Feito no Brasil 🇧🇷</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
