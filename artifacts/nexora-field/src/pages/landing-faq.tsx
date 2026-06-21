import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = "/api";

interface FaqItem { id: number; question: string; answer: string; sortOrder: number }

const DEFAULT_FAQ = [
  {
    id: 1,
    category: "Geral",
    question: "O que é a Nexora Field AI?",
    answer: "A Nexora Field AI é um marketplace de field services que conecta empresas com técnicos especializados usando inteligência artificial. Nossa plataforma simplifica todo o processo: do chamado ao pagamento, tudo em um só lugar.",
  },
  {
    id: 2,
    category: "Geral",
    question: "Para quem é a plataforma?",
    answer: "Para empresas que precisam de suporte técnico em campo (TI, Telecom, Energia Solar, CFTV, Automação, etc.) e para técnicos autônomos que querem ampliar seus clientes e receita.",
  },
  {
    id: 3,
    category: "Técnicos",
    question: "Como funciona o cadastro de técnico?",
    answer: "Crie sua conta, informe suas especialidades, área de atuação geográfica, disponibilidade e certificações. Após verificação do perfil, você começará a receber chamados compatíveis.",
  },
  {
    id: 4,
    category: "Técnicos",
    question: "Quanto posso ganhar como técnico na plataforma?",
    answer: "Os ganhos variam conforme especialidade, região e dedicação. Técnicos ativos na plataforma ganham em média R$ 4.000 a R$ 12.000/mês. Os top técnicos chegam a R$ 20.000+.",
  },
  {
    id: 5,
    category: "Técnicos",
    question: "Os técnicos precisam de CNPJ?",
    answer: "Não é obrigatório. Técnicos podem atuar como pessoa física. Recomendamos abrir MEI para facilitar a gestão financeira e ter acesso a benefícios fiscais.",
  },
  {
    id: 6,
    category: "Empresas",
    question: "Como funciona o matching de técnicos?",
    answer: "Nossa IA analisa as especialidades técnicas, localização (Haversine), histórico de avaliações, certificações e disponibilidade do técnico. O resultado é um ranking dos melhores profissionais para cada chamado.",
  },
  {
    id: 7,
    category: "Empresas",
    question: "Qual o prazo médio para encontrar um técnico?",
    answer: "Em média 2 horas para chamados em grandes centros. Em cidades menores pode levar até 24h. Chamados urgentes com valor diferenciado geralmente são atendidos mais rapidamente.",
  },
  {
    id: 8,
    category: "Empresas",
    question: "Posso acompanhar o técnico em campo?",
    answer: "Sim! O dashboard mostra o status do chamado em tempo real: aceito, check-in, em execução, check-out e finalizado. O técnico também envia evidências fotográficas durante a execução.",
  },
  {
    id: 9,
    category: "Pagamento",
    question: "Como funciona o pagamento?",
    answer: "Empresas fazem um depósito na carteira Nexora ao publicar o chamado. O valor fica retido até aprovação da execução. Após a aprovação, o pagamento é liberado automaticamente para o técnico.",
  },
  {
    id: 10,
    category: "Pagamento",
    question: "Qual a comissão da Nexora?",
    answer: "A comissão varia conforme o plano contratado. No plano Starter, a comissão é de 15%. No plano Professional, 12%. No plano Business, 10%. No plano Enterprise, a comissão é negociada.",
  },
  {
    id: 11,
    category: "Pagamento",
    question: "Como o técnico recebe o pagamento?",
    answer: "O valor é creditado na carteira Nexora do técnico. O saque pode ser feito a qualquer momento via PIX (imediato) ou transferência bancária (D+1).",
  },
  {
    id: 12,
    category: "Segurança",
    question: "Como a Nexora verifica os técnicos?",
    answer: "Verificamos identidade (RG/CPF), antecedentes criminais, certificações técnicas (via upload e validação manual) e realizamos entrevista de qualificação para categorias mais exigentes.",
  },
  {
    id: 13,
    category: "Segurança",
    question: "O que acontece se o serviço não for realizado corretamente?",
    answer: "Empresas têm prazo de 48h para aprovar ou contestar a execução. Em caso de contestação, a equipe Nexora faz a mediação. O pagamento só é liberado após resolução.",
  },
  {
    id: 14,
    category: "Planos",
    question: "Posso mudar de plano a qualquer momento?",
    answer: "Sim! O upgrade é imediato. O downgrade é aplicado no próximo ciclo de cobrança. Não há fidelidade ou multa para cancelamento.",
  },
];

const CATEGORIES_ORDER = ["Geral", "Técnicos", "Empresas", "Pagamento", "Segurança", "Planos"];

function FaqAccordion({ items }: { items: typeof DEFAULT_FAQ }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
          <button
            className="flex items-center justify-between w-full p-5 text-left hover:bg-white/5 transition-colors"
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span className="text-white font-medium text-sm sm:text-base pr-4">{item.question}</span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open === item.id ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === item.id && (
            <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingFaq() {
  const [activeCategory, setActiveCategory] = useState("Geral");

  const { data: faqData = [] } = useQuery<FaqItem[]>({
    queryKey: ["landing-faq"],
    queryFn: async () => { const r = await fetch(`${API}/landing/faq`); return r.ok ? r.json() : []; },
    staleTime: 5 * 60 * 1000,
  });

  const usedFaq = faqData.length > 0
    ? faqData.map((f, i) => ({ ...f, category: CATEGORIES_ORDER[i % CATEGORIES_ORDER.length] }))
    : DEFAULT_FAQ;

  const filtered = usedFaq.filter((f) => (f as any).category === activeCategory);

  return (
    <div className="text-white">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1.5">FAQ</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Tire todas as suas dúvidas sobre a plataforma Nexora Field.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <FaqAccordion items={filtered.length > 0 ? filtered : usedFaq.slice(0, 5)} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ainda tem dúvidas?</h2>
          <p className="text-slate-400 mb-8">Nossa equipe está pronta para ajudar você.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contato">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl">Falar com Suporte</Button>
            </Link>
            <a href="/app/register">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-xl">Criar Conta Grátis</Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
