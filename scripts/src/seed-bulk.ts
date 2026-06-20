import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });

const CITIES = [
  { city: "São Paulo", state: "SP" }, { city: "Rio de Janeiro", state: "RJ" },
  { city: "Belo Horizonte", state: "MG" }, { city: "Brasília", state: "DF" },
  { city: "Salvador", state: "BA" }, { city: "Curitiba", state: "PR" },
  { city: "Porto Alegre", state: "RS" }, { city: "Manaus", state: "AM" },
  { city: "Fortaleza", state: "CE" }, { city: "Recife", state: "PE" },
  { city: "Goiânia", state: "GO" }, { city: "Belém", state: "PA" },
  { city: "Florianópolis", state: "SC" }, { city: "Natal", state: "RN" },
  { city: "Campo Grande", state: "MS" },
];
const SPECIALTIES_POOL = ["fibra_optica","redes","cftv","automacao_industrial","infraestrutura","telecom","wireless","voip","energia_solar","datacenter"];
const CATEGORIES = ["fibra_optica","redes","cftv","automacao_industrial","infraestrutura","telecom"];
const STATUSES = ["aberto","aceito","em_andamento","finalizado","cancelado"];
const SLA_OPTIONS = ["4h","8h","24h","48h","72h"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function sample<T>(arr: T[], n: number): T[] { return shuffle(arr).slice(0, n); }

const TECH_NAMES = [
  "Carlos Silva","Ana Souza","João Pereira","Maria Santos","Pedro Costa",
  "Lucas Oliveira","Fernanda Lima","Rafael Martins","Juliana Ferreira","Bruno Alves",
  "Camila Rocha","Diego Carvalho","Isabela Ribeiro","Felipe Gomes","Thiago Nascimento",
  "Larissa Mendes","Marcos Araújo","Aline Barbosa","André Cardoso","Patricia Moreira",
  "Rodrigo Teixeira","Vanessa Correia","Leonardo Pinto","Daniela Castro","Gustavo Melo",
  "Renata Farias","Henrique Lopes","Simone Freitas","Eduardo Torres","Natalia Nunes",
  "Claudio Azevedo","Viviane Ramos","Elton Campos","Lorena Vieira","Márcio Cunha",
  "Priscila Borges","Alexandre Serrano","Tatiane Cavalcanti","Wilson Medeiros","Rosana Pimentel",
  "Sandro Lima","Keila Batista","Fábio Monteiro","Adriana Guimarães","Roberto Matos",
  "Solange Cruz","Renan Andrade","Mônica Brito","Caio Rezende","Julia Coelho",
  "Matheus Sousa","Gabriela Lima","Nathan Pires","Leticia Duarte","Igor Santana",
  "Amanda Vasconcelos","Diogo Menezes","Cristina Borges","Leandro Araújo","Sara Gonçalves",
  "Vinicius Rocha","Camille Oliveira","Jonas Leal","Patrícia Magalhães","Hernan Costa",
  "Bianca Figueiredo","Tiago Machado","Mariana Paiva","Samuel Bezerra","Aline Costa",
  "Clayton Ribeiro","Nayara Almeida","Fabiano Cortes","Carolina Maia","Eli Nogueira",
  "Vitória Barros","Ricardo Rodrigues","Daiane Siqueira","Murilo Lacerda","Eliane Dantas",
  "Kelton Vieira","Sandra Braga","Máximo Fonseca","Raquel Carvalho","Osmar Teles",
  "Ivanete Souza","Jonatas Peixoto","Denise Alves","Gilberto Chagas","Marlene Castro",
  "Davi Moraes","Emanuelle Paz","Jônatas Barros","Sônia Lima","Alex Fontana",
  "Telma Rocha","Genivaldo Cunha","Elza Marques","Flávio Serra","Conceição Dias",
];
const COMPANY_NAMES = [
  "TechPro Soluções","InfraCorp","NetConnect","DataFiber","Smart Redes",
  "EliteService","ProTech","OmegaNet","MegaConnect","UltraFiber",
  "DigitalPro","FastNetwork","SkyNet Brasil","DataCenter Pro","ConnectSP",
  "TeleNorte","TeleService","ViaFibra","LinkBrasil","AlphaTech",
];
const ORDER_TITLES = [
  "Instalação de splitter óptico em condomínio","Emenda de fibra óptica após break",
  "Configuração de switch gerenciável","Instalação de rack 12U com patch panel",
  "Instalação de câmeras IP em área externa","Configuração de DVR 16 canais",
  "Programação de CLP Siemens S7-1200","Implantação de sistema SCADA",
  "Passagem de cabos em forro de gesso","Instalação de no-break 3kVA",
  "Configuração de PABX IP","Implantação de ramal VoIP em filial",
  "Cabeamento estruturado Cat6 em escritório","Instalação de firewall Fortinet",
  "Implantação de Wi-Fi corporativo Ubiquiti","Manutenção em sistema CFTV existente",
  "Certificação de cabo óptico instalado","Fusão de fibra óptica drop",
  "Instalação de inversor de frequência WEG","Diagnóstico e reparo de CLP Schneider",
];
const COMMENTS = [
  "Excelente profissional.","Serviço impecável.","Resolveu o problema rapidamente.",
  "Ótimo serviço, recomendo!","Profissional pontual e eficiente.","Entregou dentro do prazo.",
];

async function main() {
  console.log("🌱 Iniciando seed de dados bulk...");
  const hash = await bcrypt.hash("password", 10);
  const ts = Date.now();

  // ── 1. COMPANIES ──────────────────────────────────────────────────────────────
  console.log("📦 Criando empresas...");
  const companyIds: number[] = [];
  for (let i = 0; i < COMPANY_NAMES.length; i++) {
    const name = COMPANY_NAMES[i]!;
    const email = `seed_co_${ts}_${i}@nexora.dev`;
    const loc = rand(CITIES);
    try {
      const r = await pool.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,'company') RETURNING id`,
        [email, hash, name]
      );
      if (r.rows[0]) {
        const uid = r.rows[0].id as number;
        const cnpj = `${randInt(10,99)}.${randInt(100,999)}.${randInt(100,999)}/0001-${randInt(10,99)}`;
        const c = await pool.query(
          `INSERT INTO companies (user_id,cnpj,razao_social,nome_fantasia,email,city,state) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [uid, cnpj, name, name, email, loc.city, loc.state]
        );
        if (c.rows[0]) companyIds.push(c.rows[0].id as number);
      }
    } catch (e: any) { console.error("CO ERR:", e.message); }
  }
  console.log(`✅ ${companyIds.length} empresas`);

  // ── 2. TECHNICIANS ────────────────────────────────────────────────────────────
  console.log("👷 Criando técnicos...");
  const techIds: number[] = [];
  for (let i = 0; i < TECH_NAMES.length; i++) {
    const name = TECH_NAMES[i]!;
    const email = `seed_tech_${ts}_${i}@nexora.dev`;
    const loc = rand(CITIES);
    const specs = sample(SPECIALTIES_POOL, randInt(2, 5));
    try {
      const r = await pool.query(
        `INSERT INTO users (email,password_hash,name,role) VALUES ($1,$2,$3,'technician') RETURNING id`,
        [email, hash, name]
      );
      if (r.rows[0]) {
        const uid = r.rows[0].id as number;
        const cpf = `${randInt(100,999)}.${randInt(100,999)}.${randInt(100,999)}-${randInt(10,99)}`;
        const t = await pool.query(
          `INSERT INTO technicians (user_id,name,email,cpf,phone,city,state,specialties,bio)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [uid, name, email, cpf, `(${randInt(11,99)}) 9${randInt(1000,9999)}-${randInt(1000,9999)}`,
           loc.city, loc.state,
           `{${specs.join(",")}}`,
           `Técnico em ${specs[0]?.replace(/_/g," ")} com ${randInt(1,20)} anos de experiência.`]
        );
        if (t.rows[0]) techIds.push(t.rows[0].id as number);
      }
    } catch { /* skip */ }
  }
  console.log(`✅ ${techIds.length} técnicos`);

  // ── 3. SERVICE ORDERS ─────────────────────────────────────────────────────────
  console.log("📋 Criando chamados...");
  let orderCount = 0;
  for (let i = 0; i < 300; i++) {
    const companyId = rand(companyIds);
    if (!companyId) continue;
    const loc = rand(CITIES);
    const daysAgo = randInt(1, 365);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    try {
      await pool.query(
        `INSERT INTO service_orders (company_id,title,description,category,status,city,state,address,value,sla,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [companyId, rand(ORDER_TITLES),
         "Necessário técnico especializado para execução do serviço com experiência comprovada.",
         rand(CATEGORIES), rand(STATUSES), loc.city, loc.state,
         `Rua ${rand(["das Flores","São João","Paulista","Industrial","Comercial"])} ${randInt(1,999)}`,
         randFloat(300,5000).toString(), rand(SLA_OPTIONS), createdAt]
      );
      orderCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ ${orderCount} chamados`);

  // ── 4. RATINGS ────────────────────────────────────────────────────────────────
  console.log("⭐ Criando ratings...");
  // Fetch completed orders that have an assigned technician so we can create ratings
  // Use finalizado orders for ratings
  const seedOrdersRes = await pool.query(
    `SELECT id, company_id FROM service_orders WHERE status='finalizado' ORDER BY created_at DESC LIMIT 200`
  );
  let ratingCount = 0;
  for (const techId of techIds.slice(0, 60)) {
    const companyId = rand(companyIds);
    if (!companyId) continue;
    // Pick a random completed service order for this company
    const orderRow = seedOrdersRes.rows[Math.floor(Math.random() * seedOrdersRes.rows.length)];
    if (!orderRow) continue;
    try {
      await pool.query(
        `INSERT INTO ratings (technician_id,company_id,service_order_id,score,comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [techId, orderRow.company_id, orderRow.id, randInt(4, 5), rand(COMMENTS)]
      );
      ratingCount++;
    } catch { /* skip */ }
  }
  await pool.query(`
    UPDATE technicians t SET rating=(SELECT ROUND(AVG(r.score::numeric),2) FROM ratings r WHERE r.technician_id=t.id)
    WHERE EXISTS(SELECT 1 FROM ratings r WHERE r.technician_id=t.id)
  `);
  console.log(`✅ ${ratingCount} ratings`);

  // ── 5. RANKINGS ───────────────────────────────────────────────────────────────
  console.log("🏆 Criando rankings...");
  let rankCount = 0;
  for (let i = 0; i < techIds.length; i++) {
    const techId = techIds[i]!;
    const completed = randInt(0, 80);
    const avgR = randFloat(3.5, 5);
    const score = completed * 10 + avgR * 50 + randInt(0, 200);
    const level = score > 5000 ? "diamante" : score > 2000 ? "platina" : score > 800 ? "ouro" : score > 250 ? "prata" : "bronze";
    try {
      await pool.query(
        `INSERT INTO technician_rankings (technician_id,score,level,completed_orders,avg_rating,position)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (technician_id) DO NOTHING`,
        [techId, score.toString(), level, completed, avgR.toString(), i + 1]
      );
      rankCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ ${rankCount} rankings`);

  // ── 6. NOTIFICATIONS ──────────────────────────────────────────────────────────
  console.log("🔔 Criando notificações...");
  const usersRes = await pool.query(`SELECT id,role FROM users LIMIT 50`);
  let notifCount = 0;
  for (const u of usersRes.rows) {
    const types = u.role === "technician"
      ? ["novo_chamado","chamado_aceito","avaliacao_recebida","pagamento_liberado"]
      : ["chamado_finalizado","avaliacao_recebida"];
    for (let i = 0; i < randInt(1, 5); i++) {
      const type = rand(types);
      const titles: Record<string, string> = {
        novo_chamado:"Novo chamado disponível",chamado_aceito:"Candidatura aceita!",
        chamado_finalizado:"Chamado finalizado",avaliacao_recebida:"Nova avaliação recebida",
        pagamento_liberado:"Pagamento liberado!",
      };
      try {
        await pool.query(
          `INSERT INTO notifications (user_id,type,title,message,read) VALUES ($1,$2,$3,$4,$5)`,
          [u.id, type, titles[type] || "Notificação",
           rand(["Verifique seus chamados.","Parabéns pelo serviço!","Saldo atualizado.","Acesse o painel."]),
           Math.random() > 0.4]
        );
        notifCount++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ ${notifCount} notificações`);

  console.log("\n🎉 Seed bulk concluído com sucesso!");
  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error("❌ Seed falhou:", err.message); pool.end(); process.exit(1); });
