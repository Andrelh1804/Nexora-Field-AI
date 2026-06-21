import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const PASS = await bcrypt.hash("pilot123", 10);

const TECHNICIANS = [
  { name: "Carlos Silva Piloto",   email: "carlos.silva.p@pilot.nexora.com",   city: "São Paulo",      state: "SP", lat: -23.5505, lon: -46.6333, specialties: ["Fibra Óptica","Redes ISP"],             radius: 150 },
  { name: "Ana Rodrigues Piloto",  email: "ana.rodrigues.p@pilot.nexora.com",   city: "Campinas",       state: "SP", lat: -22.9056, lon: -47.0608, specialties: ["Help Desk","Windows Server"],           radius: 100 },
  { name: "João Oliveira Piloto",  email: "joao.oliveira.p@pilot.nexora.com",   city: "Rio de Janeiro", state: "RJ", lat: -22.9068, lon: -43.1729, specialties: ["CFTV","Controle de Acesso"],            radius: 120 },
  { name: "Marcos Pereira Piloto", email: "marcos.pereira.p@pilot.nexora.com",  city: "Belo Horizonte", state: "MG", lat: -19.9167, lon: -43.9345, specialties: ["CLPs","SCADA / IHM"],                  radius: 200 },
  { name: "Fernanda Costa Piloto", email: "fernanda.costa.p@pilot.nexora.com",  city: "Curitiba",       state: "PR", lat: -25.4284, lon: -49.2733, specialties: ["AWS","Containers & Orquestração"],     radius: 80  },
  { name: "Ricardo Santos Piloto", email: "ricardo.santos.p@pilot.nexora.com",  city: "Porto Alegre",   state: "RS", lat: -30.0346, lon: -51.2177, specialties: ["Instalação Fotovoltaica","Inversores"], radius: 250 },
  { name: "Juliana Lima Piloto",   email: "juliana.lima.p@pilot.nexora.com",    city: "Salvador",       state: "BA", lat: -12.9714, lon: -38.5014, specialties: ["PABX / VoIP","Rádio Enlace"],          radius: 100 },
  { name: "Diego Alves Piloto",    email: "diego.alves.p@pilot.nexora.com",     city: "Fortaleza",      state: "CE", lat:  -3.7172, lon: -38.5433, specialties: ["Cabeamento Estruturado","Data Center"],  radius: 120 },
  { name: "Patrícia Souza Piloto", email: "patricia.souza.p@pilot.nexora.com",  city: "Manaus",         state: "AM", lat:  -3.1019, lon: -60.0250, specialties: ["Linux","Redes Corporativas"],           radius: 180 },
  { name: "Bruno Castro Piloto",   email: "bruno.castro.p@pilot.nexora.com",    city: "Brasília",       state: "DF", lat: -15.7801, lon: -47.9292, specialties: ["Azure","CI/CD & DevOps"],              radius: 100 },
];

const COMPANIES = [
  { name: "TelecomX Brasil",    email: "empresa@telecomxbrasil.pilot.nexora.com",  nf: "TelecomX Brasil",    rs: "TelecomX Brasil Ltda",             cnpj: "12.345.678/0001-90", city: "São Paulo",      state: "SP", phone: "(11) 9 9001-0001" },
  { name: "InfraNet Solutions", email: "empresa@infranet.pilot.nexora.com",         nf: "InfraNet Solutions", rs: "InfraNet Solutions SA",             cnpj: "98.765.432/0001-10", city: "Rio de Janeiro", state: "RJ", phone: "(21) 9 9002-0002" },
  { name: "SolarTech Energia",  email: "empresa@solartech.pilot.nexora.com",        nf: "SolarTech Energia",  rs: "SolarTech Energia Renovável Ltda",  cnpj: "11.222.333/0001-44", city: "Curitiba",       state: "PR", phone: "(41) 9 9003-0003" },
];

const ORDERS: { title: string; cat: string; city: string; state: string; val: number; sla: string }[] = [
  { title: "Instalação de fibra óptica GPON — 50 pontos",             cat: "telecom",              city: "São Paulo",      state: "SP", val: 3200,  sla: "24h" },
  { title: "Configuração de switch L3 Cisco — datacenter",            cat: "infraestrutura",       city: "Campinas",       state: "SP", val: 1800,  sla: "48h" },
  { title: "Manutenção preventiva de câmeras CFTV — 30 unidades",     cat: "cftv",                 city: "Rio de Janeiro", state: "RJ", val: 2500,  sla: "72h" },
  { title: "Implementação de CLP Siemens S7-1200",                    cat: "automacao_industrial", city: "Belo Horizonte", state: "MG", val: 4800,  sla: "48h" },
  { title: "Instalação sistema fotovoltaico 10kWp residencial",        cat: "infraestrutura",       city: "Curitiba",       state: "PR", val: 5200,  sla: "72h" },
  { title: "Migração de PABX físico para VoIP corporativo",           cat: "telecom",              city: "Porto Alegre",   state: "RS", val: 2200,  sla: "24h" },
  { title: "Cabeamento estruturado Cat6 — 80 pontos — escritório",    cat: "infraestrutura",       city: "Salvador",       state: "BA", val: 3600,  sla: "48h" },
  { title: "Deploy Kubernetes cluster — ambiente produção",            cat: "infraestrutura",       city: "Fortaleza",      state: "CE", val: 6500,  sla: "72h" },
  { title: "Instalação de nobreak e aterramento — sala servidores",   cat: "infraestrutura",       city: "Manaus",         state: "AM", val: 1500,  sla: "8h"  },
  { title: "Configuração de VPN corporativa Site-to-Site",            cat: "redes",                city: "Brasília",       state: "DF", val: 1200,  sla: "12h" },
  { title: "Manutenção de rádio enlace 5.8GHz — torre 40m",          cat: "telecom",              city: "São Paulo",      state: "SP", val: 2800,  sla: "24h" },
  { title: "Instalação controle de acesso biométrico — 8 pontos",     cat: "cftv",                 city: "Rio de Janeiro", state: "RJ", val: 4200,  sla: "48h" },
  { title: "Revisão e expansão de rede industrial — planta Minas",    cat: "automacao_industrial", city: "Belo Horizonte", state: "MG", val: 7800,  sla: "72h" },
  { title: "Configuração firewall pfSense — ambiente corporativo",     cat: "redes",                city: "Curitiba",       state: "PR", val:  900,  sla: "8h"  },
  { title: "Instalação de inversores solares Fronius — fazenda",      cat: "infraestrutura",       city: "Campinas",       state: "SP", val: 8500,  sla: "72h" },
  { title: "Auditoria completa de infraestrutura de TI",              cat: "infraestrutura",       city: "Porto Alegre",   state: "RS", val: 3500,  sla: "48h" },
  { title: "SCADA — linha de produção automotiva",                    cat: "automacao_industrial", city: "Fortaleza",      state: "CE", val: 12000, sla: "72h" },
  { title: "Expansão backbone fibra óptica — 10 pontos novos",        cat: "telecom",              city: "Salvador",       state: "BA", val: 5500,  sla: "48h" },
  { title: "Configuração Azure Sentinel + Defender — SOC",            cat: "infraestrutura",       city: "Brasília",       state: "DF", val: 9200,  sla: "72h" },
  { title: "Câmeras IP PTZ — planta industrial 4 torres",             cat: "cftv",                 city: "Manaus",         state: "AM", val: 6800,  sla: "48h" },
];

const STATUSES = [
  "aberto","aberto","aberto","aberto","aberto",
  "aceito","aceito","em_andamento","em_andamento",
  "finalizado","finalizado","finalizado",
  "cancelado",
  "aberto","aberto","aceito","em_andamento","finalizado","aberto","aberto",
];

async function upsertUser(email: string, name: string, role: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>("SELECT id FROM users WHERE email=$1", [email]);
  if (rows.length > 0) { console.log(`  ↩️  Já existe: ${email}`); return rows[0].id; }
  const { rows: ins } = await pool.query<{ id: number }>(
    "INSERT INTO users (name,email,password_hash,role,is_active) VALUES ($1,$2,$3,$4,true) RETURNING id",
    [name, email, PASS, role]
  );
  return ins[0].id;
}

async function seedPilot() {
  console.log("\n🌱 Seed Piloto — Nexora Field AI\n");

  // ── Técnicos ─────────────────────────────────────────
  const techIds: number[] = [];
  for (const t of TECHNICIANS) {
    const userId = await upsertUser(t.email, t.name, "technician");
    const { rows: existing } = await pool.query<{ id: number }>("SELECT id FROM technicians WHERE user_id=$1", [userId]);
    if (existing.length > 0) { techIds.push(existing[0].id); continue; }
    const days = JSON.stringify(["seg","ter","qua","qui","sex"]);
    const specs = JSON.stringify(t.specialties);
    const rating = (4.5 + Math.random() * 0.5).toFixed(2);
    const services = Math.floor(Math.random() * 30);
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO technicians
        (user_id,name,email,city,state,latitude,longitude,service_radius,
         specialties,rating,total_services,is_available,available_days,available_from,available_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text[],$10,$11,true,$12::text[],'08:00','18:00')
       RETURNING id`,
      [userId, t.name, t.email, t.city, t.state, t.lat, t.lon, t.radius,
       t.specialties, rating, services, ["seg","ter","qua","qui","sex"]]
    );
    techIds.push(rows[0].id);
    console.log(`  ✅ Técnico: ${t.name} (${t.city}/${t.state}) raio=${t.radius}km`);
  }

  // ── Empresas ─────────────────────────────────────────
  const companyIds: number[] = [];
  for (const c of COMPANIES) {
    const userId = await upsertUser(c.email, c.name, "company");
    const { rows: existing } = await pool.query<{ id: number }>("SELECT id FROM companies WHERE user_id=$1", [userId]);
    if (existing.length > 0) { companyIds.push(existing[0].id); continue; }
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO companies (user_id,nome_fantasia,razao_social,cnpj,email,city,state,phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [userId, c.nf, c.rs, c.cnpj, c.email, c.city, c.state, c.phone]
    );
    companyIds.push(rows[0].id);
    console.log(`  ✅ Empresa: ${c.nf}`);
  }

  // ── Chamados ─────────────────────────────────────────
  console.log("\n  📋 Criando chamados...\n");
  for (let i = 0; i < ORDERS.length; i++) {
    const o = ORDERS[i];
    const companyId = companyIds[i % companyIds.length];
    const status = STATUSES[i];
    const desc = `Chamado piloto #${i + 1}. ${o.title}. Serviço a ser realizado conforme SLA contratado e especificações técnicas.`;

    const { rows: [order] } = await pool.query<{ id: number }>(
      `INSERT INTO service_orders
        (company_id,title,description,category,city,state,status,value,sla)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [companyId, o.title, desc, o.cat, o.city, o.state, status, o.val, o.sla]
    );

    if (!["aberto","cancelado"].includes(status)) {
      const techId = techIds[i % techIds.length];
      const appStatus = ["aceito","em_andamento","finalizado"].includes(status) ? "accepted" : "pending";
      await pool.query(
        `INSERT INTO applications (service_order_id,technician_id,status,message)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [order.id, techId, appStatus, `Proposta técnica para o chamado: ${o.title.slice(0,40)}.`]
      );
    }

    const bar = "▓".repeat(i + 1) + "░".repeat(19 - i);
    process.stdout.write(`  [${bar}] #${String(i + 1).padStart(2,"0")} ${status.padEnd(12)} ${o.title.slice(0,38)}\n`);
  }

  console.log("\n✅ Seed piloto concluído com sucesso!");
  console.log("\n📊 Resumo:");
  console.log(`   • ${TECHNICIANS.length} técnicos (com GPS + Haversine + disponibilidade)`);
  console.log(`   • ${COMPANIES.length} empresas`);
  console.log(`   • ${ORDERS.length} chamados (aberto/aceito/em_andamento/finalizado/cancelado)`);
  console.log("\n🔑 Credenciais (senha: pilot123):");
  for (const t of TECHNICIANS) console.log(`   técnico  → ${t.email}`);
  for (const c of COMPANIES)   console.log(`   empresa  → ${c.email}`);
  await pool.end();
}

await seedPilot().catch(async e => { console.error(e); await pool.end(); process.exit(1); });
