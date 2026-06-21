let twilioClient: any = null;

function getTwilio() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const twilio = require("twilio");
    twilioClient = twilio(sid, token);
    return twilioClient;
  } catch {
    return null;
  }
}

const FROM = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

async function send(to: string, message: string): Promise<boolean> {
  if (!to) return false;
  const client = getTwilio();
  if (!client) {
    console.log(`[WhatsApp MOCK → ${to}]: ${message}`);
    return false;
  }
  try {
    const phone = to.replace(/\D/g, "");
    const formatted = phone.startsWith("55") ? `whatsapp:+${phone}` : `whatsapp:+55${phone}`;
    await client.messages.create({ from: FROM, to: formatted, body: message });
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp ERROR → ${to}]:`, err?.message ?? err);
    return false;
  }
}

export const WhatsApp = {
  async newCandidate(companyPhone: string, techName: string, orderTitle: string) {
    return send(companyPhone,
      `🔔 *Nexora Field AI*\nNovo candidato para o chamado *${orderTitle}*.\nTécnico: ${techName}\nAcesse a plataforma para avaliar a proposta.`
    );
  },
  async orderCompleted(companyPhone: string, orderTitle: string, techName: string) {
    return send(companyPhone,
      `✅ *Nexora Field AI*\nChamado *${orderTitle}* concluído.\nTécnico: ${techName}\nAcesse para avaliar o serviço e liberar o pagamento.`
    );
  },
  async newOrderForTech(techPhone: string, orderTitle: string, category: string, city: string) {
    return send(techPhone,
      `🛠️ *Nexora Field AI*\nNovo chamado disponível!\n*${orderTitle}*\nCategoria: ${category} | Cidade: ${city}\nAcesse a plataforma para se candidatar.`
    );
  },
  async orderApprovedForTech(techPhone: string, orderTitle: string, companyName: string) {
    return send(techPhone,
      `🎉 *Nexora Field AI*\nSua proposta foi *aceita*!\nChamado: *${orderTitle}*\nEmpresa: ${companyName}\nVerifique os detalhes e realize o check-in no horário combinado.`
    );
  },
  async newSubscription(adminPhone: string, userName: string, planName: string) {
    return send(adminPhone,
      `💰 *Nexora Field AI — Admin*\nNova assinatura!\nUsuário: ${userName}\nPlano: ${planName}`
    );
  },
  async criticalOrder(adminPhone: string, orderId: number, issue: string) {
    return send(adminPhone,
      `🚨 *Nexora Field AI — Alerta*\nChamado crítico #${orderId}\n${issue}`
    );
  },
};
