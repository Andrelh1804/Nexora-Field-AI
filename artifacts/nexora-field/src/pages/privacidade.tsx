import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacidade() {
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          </div>
          <p className="text-muted-foreground">
            Última atualização: 20 de junho de 2026 · Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Controlador dos Dados</h2>
            <p className="text-muted-foreground">
              A <strong className="text-foreground">Nexora Field AI</strong> ("Nexora", "nós" ou "nosso"), pessoa jurídica de direito privado, com domínio <strong className="text-foreground">nexorafield.com.br</strong>, é a controladora dos dados pessoais tratados nesta plataforma, nos termos do art. 5º, VI, da LGPD.
            </p>
            <p className="text-muted-foreground mt-2">
              Contato do Encarregado (DPO): <a href="mailto:privacidade@nexorafield.com.br" className="text-primary hover:underline">privacidade@nexorafield.com.br</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Dados Coletados</h2>
            <p className="text-muted-foreground mb-3">Coletamos os seguintes dados pessoais de acordo com o tipo de usuário:</p>
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="font-medium text-foreground mb-1">Empresas</p>
                <p className="text-muted-foreground text-xs">Nome, e-mail, telefone, Razão Social, Nome Fantasia, CNPJ, endereço, dados de faturamento e histórico de chamados de serviço.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="font-medium text-foreground mb-1">Técnicos</p>
                <p className="text-muted-foreground text-xs">Nome, e-mail, telefone, CPF/CNPJ, especialidades técnicas, localização geográfica (quando autorizada), histórico de serviços e avaliações.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="font-medium text-foreground mb-1">Dados de Uso</p>
                <p className="text-muted-foreground text-xs">Logs de acesso, endereço IP, tipo de dispositivo, navegador, páginas visitadas e ações realizadas na plataforma.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Finalidade e Base Legal do Tratamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Finalidade</th>
                    <th className="text-left py-2 text-foreground font-medium">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Prestação dos serviços da plataforma</td>
                    <td className="py-2">Art. 7º, V — Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Criação e autenticação de conta</td>
                    <td className="py-2">Art. 7º, V — Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Matching de técnicos por geolocalização</td>
                    <td className="py-2">Art. 7º, I — Consentimento</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Comunicações e notificações operacionais</td>
                    <td className="py-2">Art. 7º, V — Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Marketing e comunicações comerciais</td>
                    <td className="py-2">Art. 7º, I — Consentimento</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Prevenção a fraudes e segurança</td>
                    <td className="py-2">Art. 7º, IX — Legítimo interesse</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Obrigações legais e fiscais</td>
                    <td className="py-2">Art. 7º, II — Obrigação legal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong className="text-foreground">Outros usuários da plataforma</strong> — apenas as informações necessárias para a prestação do serviço (ex: nome e telefone do técnico para a empresa contratante).</li>
              <li><strong className="text-foreground">Prestadores de serviços</strong> — como processadores de pagamento, provedores de infraestrutura e serviços de e-mail, todos sujeitos a acordos de proteção de dados.</li>
              <li><strong className="text-foreground">Autoridades públicas</strong> — quando exigido por lei ou por ordem judicial.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong className="text-foreground">Não vendemos dados pessoais</strong> a terceiros para fins comerciais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Os dados são mantidos pelo período necessário à prestação do serviço e, após o encerramento da conta, por até <strong className="text-foreground">5 (cinco) anos</strong> para cumprimento de obrigações legais e fiscais, conforme legislação brasileira aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Seus Direitos (Art. 18 da LGPD)</h2>
            <p className="text-muted-foreground mb-3">Você tem direito a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Opor-se ao tratamento realizado com base em legítimo interesse</li>
              <li>Peticionar à Autoridade Nacional de Proteção de Dados (ANPD)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Para exercer seus direitos, entre em contato pelo e-mail <a href="mailto:privacidade@nexorafield.com.br" className="text-primary hover:underline">privacidade@nexorafield.com.br</a>. Responderemos em até <strong className="text-foreground">15 dias úteis</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Segurança</h2>
            <p className="text-muted-foreground">
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, destruição ou alteração, incluindo: criptografia em trânsito (TLS/HTTPS), hashing de senhas (bcrypt), autenticação via JWT com expiração, e controle de acesso baseado em perfil (RBAC).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Cookies</h2>
            <p className="text-muted-foreground">
              Utilizamos apenas cookies e armazenamento local estritamente necessários ao funcionamento da plataforma (token de autenticação). Não utilizamos cookies de rastreamento de terceiros ou publicidade comportamental.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Transferência Internacional</h2>
            <p className="text-muted-foreground">
              Nossos servidores estão hospedados na infraestrutura do Replit, Inc. (EUA), que atende aos requisitos de transferência internacional estabelecidos pela ANPD. Os dados são tratados com as mesmas garantias previstas nesta política.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Esta política pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações relevantes por e-mail ou por aviso na plataforma com antecedência mínima de 15 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Contato</h2>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Nexora Field AI</strong></p>
              <p>Encarregado de Dados (DPO): <a href="mailto:privacidade@nexorafield.com.br" className="text-primary hover:underline">privacidade@nexorafield.com.br</a></p>
              <p>Suporte Geral: <a href="mailto:suporte@nexorafield.com.br" className="text-primary hover:underline">suporte@nexorafield.com.br</a></p>
              <p>Site: <a href="https://nexorafield.com.br" className="text-primary hover:underline">nexorafield.com.br</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nexora Field AI · Todos os direitos reservados
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>
            <a href="mailto:privacidade@nexorafield.com.br" className="text-muted-foreground hover:text-foreground">Exercer Direitos LGPD</a>
          </div>
        </div>
      </div>
    </div>
  );
}
