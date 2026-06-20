import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Termos de Uso</h1>
          </div>
          <p className="text-muted-foreground">
            Última atualização: 20 de junho de 2026 · Ao utilizar a plataforma, você concorda com estes termos.
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao criar uma conta ou utilizar qualquer funcionalidade da plataforma <strong className="text-foreground">Nexora Field AI</strong> ("Nexora", "Plataforma"), você declara que leu, compreendeu e concorda com estes Termos de Uso e com a nossa <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>. Caso não concorde, não utilize a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Definições</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Plataforma:</strong> o sistema web e APIs disponíveis em nexorafield.com.br.</p>
              <p><strong className="text-foreground">Empresa:</strong> pessoa jurídica que contrata técnicos por meio da Plataforma.</p>
              <p><strong className="text-foreground">Técnico:</strong> profissional autônomo ou pessoa jurídica que oferece serviços técnicos por meio da Plataforma.</p>
              <p><strong className="text-foreground">Chamado:</strong> solicitação de serviço criada por uma Empresa e aceita por um Técnico.</p>
              <p><strong className="text-foreground">Nexora:</strong> a empresa controladora e operadora da Plataforma.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Cadastro e Conta</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>O cadastro é permitido apenas para maiores de 18 anos ou pessoas jurídicas devidamente constituídas.</li>
              <li>Você é responsável pela veracidade das informações fornecidas no cadastro.</li>
              <li>Cada e-mail pode estar associado a apenas uma conta.</li>
              <li>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas com sua conta.</li>
              <li>Em caso de uso não autorizado, notifique imediatamente <a href="mailto:suporte@nexorafield.com.br" className="text-primary hover:underline">suporte@nexorafield.com.br</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Natureza da Plataforma</h2>
            <p className="text-muted-foreground">
              A Nexora atua como <strong className="text-foreground">intermediadora tecnológica</strong>. A relação contratual de prestação de serviços é estabelecida diretamente entre Empresas e Técnicos. A Nexora <strong className="text-foreground">não é parte do contrato de serviço</strong> e não se responsabiliza pela qualidade, prazo ou resultado dos serviços prestados pelos Técnicos.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-3">
              <p className="text-amber-400 text-xs">
                <strong>Importante:</strong> Os Técnicos cadastrados são profissionais autônomos ou empresas independentes. Não existe vínculo empregatício entre a Nexora e os Técnicos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Responsabilidades do Usuário</h2>
            <p className="text-muted-foreground mb-2">Ao utilizar a Plataforma, você concorda em:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Não violar leis brasileiras ou direitos de terceiros.</li>
              <li>Não realizar engenharia reversa, cópia ou distribuição do software da Plataforma.</li>
              <li>Não publicar conteúdo falso, ofensivo, discriminatório ou que viole a LGPD.</li>
              <li>Não utilizar a Plataforma para fins de spam, phishing ou fraude.</li>
              <li>Não tentar acessar sistemas ou dados de outros usuários sem autorização.</li>
              <li>Fornecer informações verdadeiras e mantê-las atualizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Planos e Pagamentos</h2>
            <p className="text-muted-foreground">
              A Plataforma oferece planos gratuitos e pagos. Os planos pagos são cobrados conforme descrito na página de <Link href="/planos" className="text-primary hover:underline">Planos</Link>. As condições específicas de cobrança, cancelamento e reembolso são detalhadas no momento da contratação.
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Pagamentos são processados por gateways de pagamento certificados PCI-DSS.</li>
              <li>Não armazenamos dados de cartão de crédito.</li>
              <li>Em caso de inadimplência, o acesso ao plano pago pode ser suspenso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo da Plataforma, incluindo software, design, logotipos, textos e funcionalidades, é de propriedade exclusiva da Nexora Field AI e protegido pelas leis de propriedade intelectual brasileiras. É vedada qualquer reprodução sem autorização prévia por escrito.
            </p>
            <p className="text-muted-foreground mt-2">
              Os dados gerados pelos usuários (chamados, avaliações, histórico) permanecem de propriedade do usuário, sendo concedida à Nexora uma licença de uso para operar a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Na máxima extensão permitida pela legislação brasileira, a Nexora não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Danos decorrentes de falhas na prestação dos serviços pelos Técnicos.</li>
              <li>Interrupções temporárias por manutenção ou falhas de infraestrutura.</li>
              <li>Perdas indiretas, lucros cessantes ou danos imateriais.</li>
              <li>Atos praticados por usuários em violação a estes Termos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Suspensão e Encerramento</h2>
            <p className="text-muted-foreground">
              A Nexora reserva-se o direito de suspender ou encerrar contas que violem estes Termos, mediante notificação prévia quando possível. O usuário pode encerrar sua conta a qualquer momento mediante solicitação em <a href="mailto:suporte@nexorafield.com.br" className="text-primary hover:underline">suporte@nexorafield.com.br</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Modificações</h2>
            <p className="text-muted-foreground">
              Estes Termos podem ser alterados a qualquer momento. Notificaremos os usuários com antecedência mínima de <strong className="text-foreground">15 dias</strong> sobre alterações relevantes. O uso continuado da Plataforma após as alterações implica aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Lei Aplicável e Foro</h2>
            <p className="text-muted-foreground">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias, com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Contato</h2>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Nexora Field AI</strong></p>
              <p>Atendimento: <a href="mailto:contato@nexorafield.com.br" className="text-primary hover:underline">contato@nexorafield.com.br</a></p>
              <p>Suporte: <a href="mailto:suporte@nexorafield.com.br" className="text-primary hover:underline">suporte@nexorafield.com.br</a></p>
              <p>Site: <a href="https://nexorafield.com.br" className="text-primary hover:underline">nexorafield.com.br</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nexora Field AI · Todos os direitos reservados
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
            <a href="mailto:privacidade@nexorafield.com.br" className="text-muted-foreground hover:text-foreground">Exercer Direitos LGPD</a>
          </div>
        </div>
      </div>
    </div>
  );
}
