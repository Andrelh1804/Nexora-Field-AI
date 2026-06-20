import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SpecialtySelector, type SelectedSkill } from "@/components/specialty-selector";
import { CheckCircle2, ArrowRight, Building2, Wrench, MapPin, Zap, Sparkles } from "lucide-react";

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const fadeSlide = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Company fields
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  // Technician fields
  const [techCity, setTechCity] = useState("");
  const [techState, setTechState] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [skills, setSkills] = useState<SelectedSkill[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading]);

  const totalSteps = 3;

  const handleCompanyStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim()) return;
    setStep(2);
  };

  const handleCompanyStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCity.trim() || !companyState) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/companies/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
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
      setStep(3);
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTechStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techCity.trim() || !techState) return;
    setStep(2);
  };

  const handleTechStep2 = async () => {
    if (skills.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos uma especialidade.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create/update technician profile
      const profileRes = await fetch(`${apiBase}/api/technicians/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          city: techCity,
          state: techState,
          phone: techPhone,
          whatsapp: whatsapp || techPhone,
          specialties: skills.map(s => s.skillName),
        }),
      });
      if (!profileRes.ok) throw new Error("profile failed");

      // 2. Save structured specialties
      const specRes = await fetch(`${apiBase}/api/technicians/me/specialties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          specialties: skills.map(s => ({
            skillId: s.skillId,
            level: s.level,
            yearsExperience: s.yearsExperience,
          })),
        }),
      });
      if (!specRes.ok) throw new Error("specialties failed");

      setStep(3);
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  const isCompany = user.role === "company";

  // Wider card for the specialty step
  const isSpecialtyStep = !isCompany && step === 2;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <a href="/" className="mb-10 z-10">
        <img src="/nexora-logo.png" alt="Nexora Field" className="h-16 w-16" />
      </a>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Configuração inicial
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.min(step, totalSteps - 1)} de {totalSteps - 1}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: step === 3 ? "100%" : `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className={`w-full z-10 ${isSpecialtyStep ? "max-w-2xl" : "max-w-md"}`}>
        <AnimatePresence mode="wait">

          {/* ========== COMPANY STEPS ========== */}
          {isCompany && step === 1 && (
            <motion.div key="c1" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Dados da Empresa</h2>
                    <p className="text-sm text-muted-foreground">Como sua empresa se chama?</p>
                  </div>
                </div>
                <form onSubmit={handleCompanyStep1} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nomeFantasia">Nome Fantasia <span className="text-destructive">*</span></Label>
                    <Input
                      id="nomeFantasia"
                      placeholder="Ex: TelecomX Brasil"
                      value={nomeFantasia}
                      onChange={e => setNomeFantasia(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input
                      id="razaoSocial"
                      placeholder="Ex: TelecomX Brasil Ltda"
                      value={razaoSocial}
                      onChange={e => setRazaoSocial(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={e => setCnpj(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2 flex items-center gap-2">
                    Próximo <ArrowRight size={16} />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {isCompany && step === 2 && (
            <motion.div key="c2" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Localização e Contato</h2>
                    <p className="text-sm text-muted-foreground">Onde sua operação está baseada?</p>
                  </div>
                </div>
                <form onSubmit={handleCompanyStep2} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="companyCity">Cidade <span className="text-destructive">*</span></Label>
                      <Input
                        id="companyCity"
                        placeholder="São Paulo"
                        value={companyCity}
                        onChange={e => setCompanyCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyState">Estado <span className="text-destructive">*</span></Label>
                      <select
                        id="companyState"
                        value={companyState}
                        onChange={e => setCompanyState(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">UF</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyPhone">Telefone Comercial</Label>
                    <Input
                      id="companyPhone"
                      placeholder="(11) 9 9999-9999"
                      value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1 flex items-center gap-2" disabled={submitting}>
                      {submitting ? "Salvando..." : (<>Concluir <ArrowRight size={16} /></>)}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ========== TECHNICIAN STEPS ========== */}
          {!isCompany && step === 1 && (
            <motion.div key="t1" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Onde você atua?</h2>
                    <p className="text-sm text-muted-foreground">Sua localização ajuda no match de chamados.</p>
                  </div>
                </div>
                <form onSubmit={handleTechStep1} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="techCity">Cidade <span className="text-destructive">*</span></Label>
                      <Input
                        id="techCity"
                        placeholder="São Paulo"
                        value={techCity}
                        onChange={e => setTechCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="techState">Estado <span className="text-destructive">*</span></Label>
                      <select
                        id="techState"
                        value={techState}
                        onChange={e => setTechState(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">UF</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="techPhone">Telefone</Label>
                    <Input
                      id="techPhone"
                      placeholder="(11) 9 9999-9999"
                      value={techPhone}
                      onChange={e => setTechPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="(11) 9 9999-9999"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full flex items-center gap-2">
                    Próximo <ArrowRight size={16} />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {!isCompany && step === 2 && (
            <motion.div key="t2" variants={fadeSlide} initial="hidden" animate="visible" exit="exit">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Suas Especialidades</h2>
                    <p className="text-sm text-muted-foreground">
                      Escolha skills específicas para ter mais matches.{" "}
                      {skills.length > 0 && (
                        <span className="text-primary font-medium">{skills.length} selecionadas</span>
                      )}
                    </p>
                  </div>
                </div>

                <SpecialtySelector value={skills} onChange={setSkills} maxSkills={25} />

                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    onClick={handleTechStep2}
                    disabled={submitting || skills.length === 0}
                  >
                    {submitting ? "Salvando..." : (<>Concluir <ArrowRight size={16} /></>)}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========== SUCCESS STEP ========== */}
          {step === 3 && (
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

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Tudo configurado! 🎉
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isCompany
                    ? "Sua empresa está pronta para começar a contratar técnicos com inteligência artificial."
                    : `Seu perfil está pronto com ${skills.length} especialidades cadastradas. Agora você receberá chamados compatíveis com suas skills.`}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {(isCompany ? [
                    { icon: <Zap size={14} />, label: "Crie seu primeiro chamado" },
                    { icon: <Building2 size={14} />, label: "Acesse o dashboard executivo" },
                  ] : [
                    { icon: <Zap size={14} />, label: "Veja os chamados disponíveis" },
                    { icon: <Wrench size={14} />, label: "Gerencie suas especialidades" },
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 text-sm text-muted-foreground">
                      <span className="text-primary shrink-0">{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setLocation("/dashboard")}
                >
                  Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Skip link */}
      {step < 3 && (
        <button
          onClick={() => setLocation("/dashboard")}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          Pular por enquanto →
        </button>
      )}
    </div>
  );
}
