import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SpecialtySelector, type SelectedSkill } from "@/components/specialty-selector";
import {
  CheckCircle2, ArrowRight, Building2, Wrench, MapPin, Zap, Sparkles,
  Calendar, FileText, Users, Target,
} from "lucide-react";

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const WEEK_DAYS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

const SEGMENTS = ["Telecom", "TI / Redes", "Energia / Elétrica", "Automação Industrial", "Segurança Eletrônica", "Energia Solar", "Cloud / DevOps", "Outro"];

const fadeSlide = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function StepHeader({ icon, title, desc, color = "primary" }: { icon: React.ReactNode; title: string; desc: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`h-10 w-10 rounded-xl bg-${color}/15 flex items-center justify-center text-${color}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Company
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ie, setIe] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companySegment, setCompanySegment] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Technician
  const [techCity, setTechCity] = useState("");
  const [techState, setTechState] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [serviceRadius, setServiceRadius] = useState(100);
  const [techLat, setTechLat] = useState<number | null>(null);
  const [techLon, setTechLon] = useState<number | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("08:00");
  const [availableTo, setAvailableTo] = useState("18:00");

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading]);

  const isCompany = user?.role === "company";
  const totalSteps = isCompany ? 4 : 5;

  const tryGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setTechLat(pos.coords.latitude); setTechLon(pos.coords.longitude); },
      () => {}
    );
  };

  const saveCompany = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/companies/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          nomeFantasia,
          razaoSocial: razaoSocial || nomeFantasia,
          cnpj: cnpj || "00.000.000/0001-00",
          city: companyCity,
          state: companyState,
          phone: companyPhone,
        }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const saveTechnician = async () => {
    setSubmitting(true);
    try {
      const profileRes = await fetch(`${apiBase}/api/technicians/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          city: techCity, state: techState,
          phone: techPhone, whatsapp: whatsapp || techPhone,
          specialties: skills.map(s => s.skillName),
          latitude: techLat, longitude: techLon,
          serviceRadius,
          availableDays, availableFrom, availableTo,
        }),
      });
      if (!profileRes.ok) throw new Error("profile failed");

      const specRes = await fetch(`${apiBase}/api/technicians/me/specialties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ specialties: skills.map(s => ({ skillId: s.skillId, level: s.level, yearsExperience: s.yearsExperience })) }),
      });
      if (!specRes.ok) throw new Error("specialties failed");
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
      throw new Error("save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (isLoading || !user) return null;

  const isSpecialtyStep = !isCompany && step === 2;
  const successStep = totalSteps;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <a href="/" className="mb-10 z-10">
        <img src="/nexora-logo.png" alt="Nexora Field" className="h-16 w-16" />
      </a>

      {/* Progress */}
      <div className="w-full max-w-md mb-8 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {isCompany ? "Configuração da empresa" : "Configuração do perfil"}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.min(step, totalSteps - 1)} de {totalSteps - 1}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: step >= successStep ? "100%" : `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalSteps - 1 }, (_, i) => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className={`w-full z-10 ${isSpecialtyStep ? "max-w-2xl" : "max-w-md"}`}>
        <AnimatePresence mode="wait">

          {/* ===== COMPANY STEP 1 — Dados da empresa ===== */}
          {isCompany && step === 1 && (
            <motion.div key="c1" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<Building2 size={20} />} title="Dados da Empresa" desc="Como sua empresa se chama?" />
                <form onSubmit={e => { e.preventDefault(); if (nomeFantasia.trim()) setStep(2); }} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome Fantasia <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ex: TelecomX Brasil" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Razão Social</Label>
                    <Input placeholder="Ex: TelecomX Brasil Ltda" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Segmento de Atuação</Label>
                    <select value={companySegment} onChange={e => setCompanySegment(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="">Selecione...</option>
                      {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <Button type="submit" className="w-full gap-2">Próximo <ArrowRight size={16} /></Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ===== COMPANY STEP 2 — Dados fiscais ===== */}
          {isCompany && step === 2 && (
            <motion.div key="c2" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<FileText size={20} />} title="Dados Fiscais" desc="Informações para emissão de contratos e notas fiscais." />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>CNPJ</Label>
                      <Input placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Inscrição Estadual</Label>
                      <Input placeholder="ISENTO ou número" value={ie} onChange={e => setIe(e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">💡 Você pode preencher depois em Configurações → Dados Fiscais. Esses dados são usados em contratos eletrônicos.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                    <Button className="flex-1 gap-2" onClick={() => setStep(3)}>Próximo <ArrowRight size={16} /></Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== COMPANY STEP 3 — Localização + Equipe ===== */}
          {isCompany && step === 3 && (
            <motion.div key="c3" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<Users size={20} />} title="Localização e Equipe" desc="Onde sua operação está baseada?" />
                <form onSubmit={async e => { e.preventDefault(); await saveCompany(); setStep(4); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label>Cidade <span className="text-destructive">*</span></Label>
                      <Input placeholder="São Paulo" value={companyCity} onChange={e => setCompanyCity(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado <span className="text-destructive">*</span></Label>
                      <select value={companyState} onChange={e => setCompanyState(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option value="">UF</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Telefone Comercial</Label>
                      <Input placeholder="(11) 9 9999-9999" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tamanho da Equipe</Label>
                      <select value={teamSize} onChange={e => setTeamSize(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option value="">Selecione</option>
                        <option value="1-5">1–5 pessoas</option>
                        <option value="6-20">6–20 pessoas</option>
                        <option value="21-100">21–100 pessoas</option>
                        <option value="100+">100+ pessoas</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                      {submitting ? "Salvando..." : (<>Concluir <ArrowRight size={16} /></>)}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ===== TECH STEP 1 — Localização ===== */}
          {!isCompany && step === 1 && (
            <motion.div key="t1" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<MapPin size={20} />} title="Onde você atua?" desc="Sua localização ajuda no match de chamados." color="secondary" />
                <form onSubmit={e => { e.preventDefault(); if (techCity.trim() && techState) setStep(2); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label>Cidade <span className="text-destructive">*</span></Label>
                      <Input placeholder="São Paulo" value={techCity} onChange={e => setTechCity(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado <span className="text-destructive">*</span></Label>
                      <select value={techState} onChange={e => setTechState(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option value="">UF</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input placeholder="(11) 9 9999-9999" value={techPhone} onChange={e => setTechPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>WhatsApp</Label>
                      <Input placeholder="(11) 9 9999-9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2">Próximo <ArrowRight size={16} /></Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ===== TECH STEP 2 — Especialidades ===== */}
          {!isCompany && step === 2 && (
            <motion.div key="t2" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<Sparkles size={20} />} title="Suas Especialidades" desc={`Escolha skills específicas. ${skills.length > 0 ? `${skills.length} selecionadas` : ""}`} color="secondary" />
                <SpecialtySelector value={skills} onChange={setSkills} maxSkills={25} />
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                  <Button
                    className="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    onClick={() => { if (skills.length === 0) { toast({ title: "Selecione ao menos uma especialidade.", variant: "destructive" }); return; } setStep(3); }}
                  >
                    Próximo <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== TECH STEP 3 — Raio de atuação ===== */}
          {!isCompany && step === 3 && (
            <motion.div key="t3" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<Target size={20} />} title="Raio de Atuação" desc="Defina até onde você atende chamados." color="secondary" />
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Raio máximo de deslocamento</Label>
                      <span className="text-primary font-bold text-lg">{serviceRadius} km</span>
                    </div>
                    <input
                      type="range"
                      min={10} max={500} step={10}
                      value={serviceRadius}
                      onChange={e => setServiceRadius(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 km</span><span>250 km</span><span>500 km</span>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">📍 Usar minha localização exata (GPS)</p>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { tryGeolocate(); toast({ title: "Localização capturada!", description: "Coordenadas salvas para matching por Haversine." }); }}>
                        {techLat ? "✅ Capturada" : "Capturar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">O GPS melhora a precisão do matching. Sem GPS, usamos cidade/estado.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                    <Button className="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setStep(4)}>
                      Próximo <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== TECH STEP 4 — Disponibilidade ===== */}
          {!isCompany && step === 4 && (
            <motion.div key="t4" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <StepHeader icon={<Calendar size={20} />} title="Disponibilidade" desc="Quando você está disponível para chamados?" color="secondary" />
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm">Dias da semana</Label>
                    <div className="flex gap-2 flex-wrap">
                      {WEEK_DAYS.map(d => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${availableDays.includes(d.value) ? "bg-secondary text-secondary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Das</Label>
                      <Input type="time" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Até</Label>
                      <Input type="time" value={availableTo} onChange={e => setAvailableTo(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
                    <Button
                      className="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      disabled={submitting}
                      onClick={async () => {
                        try {
                          await saveTechnician();
                          setStep(5);
                        } catch {}
                      }}
                    >
                      {submitting ? "Salvando..." : (<>Concluir <ArrowRight size={16} /></>)}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== SUCCESS ===== */}
          {step === successStep && (
            <motion.div key="success" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-10 shadow-xl text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                  className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-secondary/15 text-secondary mb-6 mx-auto"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Tudo configurado! 🎉</h2>
                <p className="text-muted-foreground mb-8">
                  {isCompany
                    ? "Sua empresa está pronta. Crie seu primeiro chamado e receba propostas de técnicos qualificados com IA."
                    : `Seu perfil está pronto com ${skills.length} especialidades e raio de ${serviceRadius} km. Você já receberá chamados compatíveis!`}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {(isCompany ? [
                    { icon: <Zap size={14} />, label: "Crie seu primeiro chamado" },
                    { icon: <Building2 size={14} />, label: "Acesse o dashboard executivo" },
                  ] : [
                    { icon: <Zap size={14} />, label: "Veja chamados compatíveis" },
                    { icon: <Wrench size={14} />, label: "Envie suas certificações" },
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 text-sm text-muted-foreground">
                      <span className="text-primary shrink-0">{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
                <Button size="lg" className="w-full" onClick={() => setLocation("/dashboard")}>
                  Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {step < successStep && (
        <button onClick={() => setLocation("/dashboard")} className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors z-10">
          Pular por enquanto →
        </button>
      )}
    </div>
  );
}
