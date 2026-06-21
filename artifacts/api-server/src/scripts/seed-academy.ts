import { db } from "@workspace/db";
import { academyCoursesTable } from "@workspace/db";
import { count } from "drizzle-orm";

interface CourseInput {
  title: string;
  description: string;
  specialty: string;
  category: string;
  level: "iniciante" | "intermediario" | "avancado" | "especialista";
  duration: number;
  content: string;
  pointsValue: number;
  isMandatory?: boolean;
  rating?: number;
}

const COURSES: CourseInput[] = [
  // ── TELECOM E FIBRA ÓPTICA ─────────────────────────────────────────
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "iniciante", title: "Introdução à Fibra Óptica", description: "Conceitos fundamentais de fibra óptica, tipos de cabos, janelas de transmissão e aplicações.", duration: 4, content: "Módulo 1: Conceitos; Módulo 2: Tipos de fibra; Módulo 3: Aplicações", pointsValue: 50, rating: 4.7 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "iniciante", title: "Fundamentos de FTTH", description: "Arquitetura FTTH, topologias PON, planejamento e dimensionamento de redes FTTH.", duration: 6, content: "Módulo 1: Arquitetura FTTH; Módulo 2: PON; Módulo 3: Planejamento", pointsValue: 50, rating: 4.8 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "intermediario", title: "Fusão de Fibra Óptica", description: "Técnicas de fusão, preparação de cabo, procedimentos de splicing e boas práticas.", duration: 8, content: "Módulo 1: Ferramentas; Módulo 2: Técnicas de fusão; Módulo 3: Medições", pointsValue: 50, rating: 4.9 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "intermediario", title: "OTDR na Prática", description: "Operação de OTDR, leitura de traces, diagnóstico de falhas e interpretação de resultados.", duration: 6, content: "Módulo 1: Princípios OTDR; Módulo 2: Operação; Módulo 3: Diagnóstico", pointsValue: 50, rating: 4.8 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "avancado", title: "Certificação de Enlaces", description: "Certificação de enlaces ópticos conforme padrões TIA/EIA e ISO/IEC.", duration: 5, content: "Módulo 1: Normas; Módulo 2: Medições; Módulo 3: Laudos técnicos", pointsValue: 100, rating: 4.7 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "avancado", title: "GPON e XGS-PON", description: "Tecnologias GPON e XGS-PON, configuração de OLT/ONU, troubleshooting avançado.", duration: 8, content: "Módulo 1: GPON; Módulo 2: XGS-PON; Módulo 3: Configuração avançada", pointsValue: 100, rating: 4.9 },
  { category: "Telecom e Fibra Óptica", specialty: "Fibra Óptica", level: "especialista", title: "Troubleshooting em Redes Ópticas", description: "Diagnóstico avançado de falhas em redes ópticas complexas e planos de contingência.", duration: 10, content: "Módulo 1: Metodologia; Módulo 2: Ferramentas avançadas; Módulo 3: Casos reais", pointsValue: 100, rating: 4.8 },

  // ── REDES E INFRAESTRUTURA DE TI ───────────────────────────────────
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "iniciante", title: "Fundamentos de Redes TCP/IP", description: "Modelo OSI, protocolo TCP/IP, endereçamento IP, sub-redes e conceitos essenciais.", duration: 6, content: "Módulo 1: Modelo OSI; Módulo 2: TCP/IP; Módulo 3: Endereçamento", pointsValue: 50, rating: 4.7 },
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "iniciante", title: "Cabeamento Estruturado", description: "Normas ANSI/TIA-568, categorias de cabo, terminação, certificação e organização de patch panels.", duration: 5, content: "Módulo 1: Normas; Módulo 2: Instalação; Módulo 3: Certificação", pointsValue: 50, rating: 4.6 },
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "intermediario", title: "Switching e VLANs", description: "Configuração de switches, VLANs, STP, trunking e boas práticas em redes corporativas.", duration: 7, content: "Módulo 1: Switches; Módulo 2: VLANs; Módulo 3: STP e redundância", pointsValue: 50, rating: 4.8 },
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "intermediario", title: "Redes Wireless Corporativas", description: "Configuração de APs, controladores wireless, segurança WPA3 e redes guest.", duration: 6, content: "Módulo 1: Fundamentos Wi-Fi; Módulo 2: Configuração; Módulo 3: Segurança", pointsValue: 50, rating: 4.7 },
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "avancado", title: "MikroTik Básico", description: "RouterOS, configuração de roteadores MikroTik, firewall, QoS e NAT.", duration: 8, content: "Módulo 1: RouterOS; Módulo 2: Roteamento; Módulo 3: Firewall e QoS", pointsValue: 100, rating: 4.9 },
  { category: "Redes e Infraestrutura TI", specialty: "Redes", level: "avancado", title: "Ubiquiti Básico", description: "Equipamentos Ubiquiti UniFi e airMAX, configuração, gerenciamento e rádio enlace.", duration: 6, content: "Módulo 1: UniFi; Módulo 2: airMAX; Módulo 3: Gerenciamento", pointsValue: 100, rating: 4.8 },
  { category: "Redes e Infraestrutura TI", specialty: "Infraestrutura TI", level: "intermediario", title: "Introdução a Datacenters", description: "Fundamentos de datacenter: cooling, energia, cabeamento estruturado, racks e segurança.", duration: 5, content: "Módulo 1: Infraestrutura; Módulo 2: Energia e cooling; Módulo 3: Segurança", pointsValue: 50, rating: 4.6 },

  // ── CFTV E SEGURANÇA ELETRÔNICA ────────────────────────────────────
  { category: "CFTV e Segurança Eletrônica", specialty: "CFTV", level: "iniciante", title: "Introdução ao CFTV", description: "Fundamentos de CFTV, tipos de câmeras, resolução, IR e principais aplicações.", duration: 4, content: "Módulo 1: Câmeras; Módulo 2: Gravação; Módulo 3: Monitoramento", pointsValue: 50, rating: 4.6 },
  { category: "CFTV e Segurança Eletrônica", specialty: "CFTV", level: "iniciante", title: "Instalação de Câmeras", description: "Técnicas de instalação, posicionamento, ângulo de cobertura e passagem de cabo.", duration: 5, content: "Módulo 1: Planejamento; Módulo 2: Instalação; Módulo 3: Configuração inicial", pointsValue: 50, rating: 4.7 },
  { category: "CFTV e Segurança Eletrônica", specialty: "CFTV", level: "intermediario", title: "CFTV IP", description: "Câmeras IP, protocolos ONVIF, RTSP, configuração de rede e integração com NVR.", duration: 6, content: "Módulo 1: Câmeras IP; Módulo 2: Protocolos; Módulo 3: Integração", pointsValue: 50, rating: 4.8 },
  { category: "CFTV e Segurança Eletrônica", specialty: "CFTV", level: "intermediario", title: "DVR e NVR", description: "Configuração, armazenamento, acesso remoto e manutenção de DVR e NVR.", duration: 5, content: "Módulo 1: DVR; Módulo 2: NVR; Módulo 3: Acesso remoto", pointsValue: 50, rating: 4.7 },
  { category: "CFTV e Segurança Eletrônica", specialty: "Controle de Acesso", level: "avancado", title: "Controle de Acesso", description: "Catracas, fechaduras eletromagnéticas, biometria, RFID e integração com sistemas.", duration: 7, content: "Módulo 1: Periféricos; Módulo 2: Configuração; Módulo 3: Integração", pointsValue: 100, rating: 4.8 },
  { category: "CFTV e Segurança Eletrônica", specialty: "CFTV", level: "avancado", title: "Interfonia e Vídeo Porteiro", description: "Instalação e configuração de sistemas de interfonia analógica e IP.", duration: 4, content: "Módulo 1: Interfonia analógica; Módulo 2: Vídeo porteiro IP; Módulo 3: Integração", pointsValue: 100, rating: 4.6 },

  // ── ELETRÔNICA ─────────────────────────────────────────────────────
  { category: "Eletrônica", specialty: "Eletrônica", level: "iniciante", title: "Eletricidade Básica", description: "Corrente, tensão, resistência, lei de Ohm, circuitos série e paralelo.", duration: 5, content: "Módulo 1: Fundamentos; Módulo 2: Circuitos; Módulo 3: Medições", pointsValue: 50, rating: 4.7 },
  { category: "Eletrônica", specialty: "Eletrônica", level: "iniciante", title: "Uso Correto do Multímetro", description: "Operação de multímetro digital, medições de tensão, corrente e resistência com segurança.", duration: 3, content: "Módulo 1: Multímetro; Módulo 2: Medições; Módulo 3: Segurança", pointsValue: 50, rating: 4.8 },
  { category: "Eletrônica", specialty: "Eletrônica", level: "iniciante", title: "Leitura de Diagramas Elétricos", description: "Simbologia elétrica, leitura de esquemas, manuais técnicos e diagramas unifilares.", duration: 4, content: "Módulo 1: Simbologia; Módulo 2: Esquemas; Módulo 3: Prática", pointsValue: 50, rating: 4.6 },
  { category: "Eletrônica", specialty: "Eletrônica", level: "intermediario", title: "Eletrônica Analógica", description: "Diodos, transistores, amplificadores op-amp e circuitos de sinal.", duration: 7, content: "Módulo 1: Diodos; Módulo 2: Transistores; Módulo 3: Op-Amp", pointsValue: 50, rating: 4.7 },
  { category: "Eletrônica", specialty: "Eletrônica", level: "avancado", title: "Eletrônica Digital", description: "Portas lógicas, circuitos combinacionais, sequenciais e microcontroladores.", duration: 8, content: "Módulo 1: Lógica digital; Módulo 2: Circuitos; Módulo 3: Microcontroladores", pointsValue: 100, rating: 4.8 },
  { category: "Eletrônica", specialty: "Eletrônica", level: "avancado", title: "Diagnóstico de Equipamentos", description: "Metodologia de diagnóstico, técnicas de bancada, soldagem SMD e reparo de placas.", duration: 9, content: "Módulo 1: Metodologia; Módulo 2: Ferramentas; Módulo 3: Reparo SMD", pointsValue: 100, rating: 4.9 },

  // ── AUTOMAÇÃO INDUSTRIAL ───────────────────────────────────────────
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "iniciante", title: "Introdução à Automação", description: "Conceitos de automação industrial, sensores, atuadores e sistemas de controle.", duration: 5, content: "Módulo 1: Fundamentos; Módulo 2: Sensores; Módulo 3: Atuadores", pointsValue: 50, rating: 4.7 },
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "iniciante", title: "Sensores e Atuadores", description: "Tipos de sensores industriais, calibração, instalação e manutenção de atuadores.", duration: 6, content: "Módulo 1: Sensores indutivos; Módulo 2: Sensores capacitivos; Módulo 3: Atuadores", pointsValue: 50, rating: 4.7 },
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "intermediario", title: "CLP Básico", description: "Programação de CLPs Siemens S7 e Allen-Bradley em Ladder e Function Block Diagram.", duration: 10, content: "Módulo 1: Arquitetura CLP; Módulo 2: Ladder; Módulo 3: FBD", pointsValue: 50, rating: 4.9 },
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "intermediario", title: "Redes Industriais", description: "Profibus, Profinet, Modbus RTU/TCP, DeviceNet e integração de sistemas.", duration: 7, content: "Módulo 1: Profibus; Módulo 2: Profinet; Módulo 3: Modbus", pointsValue: 50, rating: 4.8 },
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "avancado", title: "Supervisórios e SCADA", description: "Implementação de SCADA, configuração de IHM, tags, alarmes e trending.", duration: 8, content: "Módulo 1: SCADA; Módulo 2: IHM; Módulo 3: Integração", pointsValue: 100, rating: 4.8 },
  { category: "Automação Industrial", specialty: "Automação Industrial", level: "especialista", title: "Indústria 4.0", description: "IoT Industrial, digital twin, análise de dados de chão de fábrica e integração MES/ERP.", duration: 10, content: "Módulo 1: IIoT; Módulo 2: Digital Twin; Módulo 3: Integração ERP", pointsValue: 100, rating: 4.9 },

  // ── ENERGIA SOLAR ──────────────────────────────────────────────────
  { category: "Energia Solar", specialty: "Energia Solar", level: "iniciante", title: "Fundamentos da Energia Solar", description: "Princípios fotovoltaicos, irradiação solar, tipos de painéis e eficiência.", duration: 5, content: "Módulo 1: Efeito fotovoltaico; Módulo 2: Tipos de painel; Módulo 3: Irradiação", pointsValue: 50, rating: 4.8 },
  { category: "Energia Solar", specialty: "Energia Solar", level: "intermediario", title: "Segurança em Sistemas Fotovoltaicos", description: "NR10, NR35, EPI, trabalho em altura e cuidados com sistemas elétricos fotovoltaicos.", duration: 4, content: "Módulo 1: NR10/NR35; Módulo 2: EPIs; Módulo 3: Procedimentos de segurança", pointsValue: 50, rating: 4.9 },
  { category: "Energia Solar", specialty: "Energia Solar", level: "intermediario", title: "Instalação de Sistemas Fotovoltaicos", description: "Montagem de estruturas, cabeamento, string box, inversores e comissionamento.", duration: 8, content: "Módulo 1: Estruturas; Módulo 2: Cabeamento DC; Módulo 3: Comissionamento", pointsValue: 50, rating: 4.8 },
  { category: "Energia Solar", specialty: "Energia Solar", level: "avancado", title: "Inversores e String Box", description: "Configuração de inversores string e microinversores, proteções e string box.", duration: 6, content: "Módulo 1: Inversores string; Módulo 2: Microinversores; Módulo 3: String box", pointsValue: 100, rating: 4.8 },
  { category: "Energia Solar", specialty: "Energia Solar", level: "especialista", title: "Dimensionamento de Sistemas", description: "Cálculo de geração, dimensionamento de inversores, baterias e projeto completo.", duration: 8, content: "Módulo 1: Irradiação e perdas; Módulo 2: Dimensionamento; Módulo 3: Projeto completo", pointsValue: 100, rating: 4.9 },

  // ── CERTIFICAÇÕES PROFISSIONAIS ────────────────────────────────────
  { category: "Certificações Profissionais", specialty: "Segurança", level: "intermediario", title: "Preparatório NR10", description: "Norma Regulamentadora NR10 completa: instalações elétricas, segurança e habilitação.", duration: 8, content: "Módulo 1: NR10 Básico; Módulo 2: NR10 Complementar; Módulo 3: Simulados", pointsValue: 200, rating: 4.9 },
  { category: "Certificações Profissionais", specialty: "Segurança", level: "intermediario", title: "Preparatório NR35", description: "Norma Regulamentadora NR35: trabalho em altura, EPI, plano de resgate.", duration: 6, content: "Módulo 1: NR35 Fundamentos; Módulo 2: EPIs e equipamentos; Módulo 3: Resgate", pointsValue: 200, rating: 4.9 },
  { category: "Certificações Profissionais", specialty: "Redes", level: "avancado", title: "Preparatório Cisco CCNA", description: "Conteúdo completo para certificação CCNA: roteamento, switching, segurança e automação.", duration: 40, content: "Módulo 1: Fundamentos; Módulo 2: Roteamento; Módulo 3: Switching; Módulo 4: Segurança", pointsValue: 200, rating: 4.9 },
  { category: "Certificações Profissionais", specialty: "Redes", level: "avancado", title: "Preparatório MikroTik MTCNA", description: "Conteúdo oficial MikroTik MTCNA: RouterOS, firewall, QoS e VPN.", duration: 20, content: "Módulo 1: RouterOS; Módulo 2: Firewall; Módulo 3: VPN; Módulo 4: QoS", pointsValue: 200, rating: 4.8 },
  { category: "Certificações Profissionais", specialty: "Fibra Óptica", level: "avancado", title: "Preparatório Furukawa FCP", description: "Certificação Furukawa FCP: cabeamento estruturado, fibra óptica e normas.", duration: 15, content: "Módulo 1: Normas; Módulo 2: Fibra; Módulo 3: Cobre; Módulo 4: Simulados", pointsValue: 200, rating: 4.8 },
  { category: "Certificações Profissionais", specialty: "Cloud", level: "avancado", title: "Preparatório AWS Cloud Practitioner", description: "Conceitos cloud AWS, serviços principais, faturamento e segurança.", duration: 15, content: "Módulo 1: Cloud fundamentals; Módulo 2: AWS services; Módulo 3: Security; Módulo 4: Billing", pointsValue: 200, rating: 4.8 },
  { category: "Certificações Profissionais", specialty: "Cloud", level: "avancado", title: "Preparatório Azure Fundamentals", description: "Conceitos Microsoft Azure, serviços cloud, identidade e conformidade.", duration: 12, content: "Módulo 1: Azure fundamentals; Módulo 2: Core services; Módulo 3: Identity; Módulo 4: Compliance", pointsValue: 200, rating: 4.7 },
  { category: "Certificações Profissionais", specialty: "Telecom", level: "avancado", title: "Preparatório Huawei HCIA", description: "Certificação Huawei HCIA: redes, equipamentos e soluções Huawei.", duration: 20, content: "Módulo 1: Fundamentos; Módulo 2: Equipamentos Huawei; Módulo 3: Configuração; Módulo 4: Simulados", pointsValue: 200, rating: 4.7 },

  // ── INTELIGÊNCIA ARTIFICIAL PARA TÉCNICOS ─────────────────────────
  { category: "Inteligência Artificial", specialty: "IA e Dados", level: "iniciante", title: "Introdução à IA para Técnicos de Campo", description: "Como a IA está transformando o field service: matching, diagnóstico e automação.", duration: 3, content: "Módulo 1: IA e field service; Módulo 2: Machine learning; Módulo 3: Casos de uso", pointsValue: 50, rating: 4.7 },
  { category: "Inteligência Artificial", specialty: "IA e Dados", level: "intermediario", title: "Diagnóstico Assistido por IA", description: "Utilização de ferramentas de IA para diagnóstico técnico, análise de sintomas e sugestão de soluções.", duration: 4, content: "Módulo 1: Ferramentas de IA; Módulo 2: Diagnóstico; Módulo 3: Prática", pointsValue: 50, rating: 4.8 },
  { category: "Inteligência Artificial", specialty: "IA e Dados", level: "intermediario", title: "Utilizando o Nexora Copilot", description: "Copilot Nexora para técnicos: diagnóstico assistido, relatórios e suporte em campo.", duration: 2, content: "Módulo 1: Copilot overview; Módulo 2: Diagnóstico; Módulo 3: Relatórios", pointsValue: 50, rating: 4.9 },
  { category: "Inteligência Artificial", specialty: "IA e Dados", level: "avancado", title: "Análise de Equipamentos por Imagem", description: "Visão computacional aplicada: análise de equipamentos, identificação de falhas por câmera.", duration: 5, content: "Módulo 1: Visão computacional; Módulo 2: Análise de imagens; Módulo 3: Diagnóstico visual", pointsValue: 100, rating: 4.8 },
  { category: "Inteligência Artificial", specialty: "IA e Dados", level: "avancado", title: "Criação de Relatórios Técnicos com IA", description: "Uso de IA generativa para criar relatórios técnicos profissionais a partir de notas de campo.", duration: 3, content: "Módulo 1: IA generativa; Módulo 2: Estrutura de relatórios; Módulo 3: Prática", pointsValue: 100, rating: 4.9 },

  // ── GESTÃO E EMPREENDEDORISMO ──────────────────────────────────────
  { category: "Gestão e Empreendedorismo", specialty: "Gestão", level: "iniciante", title: "Como Trabalhar como Técnico Autônomo", description: "Organização pessoal, captação de clientes, contratos, NF e gestão de agenda.", duration: 4, content: "Módulo 1: Perfil autônomo; Módulo 2: Captação; Módulo 3: Contratos e NF", pointsValue: 50, rating: 4.8 },
  { category: "Gestão e Empreendedorismo", specialty: "Gestão", level: "iniciante", title: "Precificação de Serviços", description: "Como calcular preços justos: custos, horas, margem, mercado e tabelas de referência.", duration: 3, content: "Módulo 1: Composição de custo; Módulo 2: Margem; Módulo 3: Tabelas", pointsValue: 50, rating: 4.7 },
  { category: "Gestão e Empreendedorismo", specialty: "Gestão", level: "intermediario", title: "Atendimento ao Cliente", description: "Comunicação profissional, gestão de expectativas, resolução de conflitos e fidelização.", duration: 3, content: "Módulo 1: Comunicação; Módulo 2: Gestão de expectativas; Módulo 3: Fidelização", pointsValue: 50, rating: 4.8 },
  { category: "Gestão e Empreendedorismo", specialty: "Gestão", level: "intermediario", title: "Gestão Financeira para Técnicos", description: "Fluxo de caixa, separação PF/PJ, investimentos e planejamento financeiro pessoal.", duration: 4, content: "Módulo 1: Fluxo de caixa; Módulo 2: PJ vs PF; Módulo 3: Planejamento", pointsValue: 50, rating: 4.8 },
  { category: "Gestão e Empreendedorismo", specialty: "Gestão", level: "avancado", title: "Como Abrir sua Empresa de Serviços", description: "Tipos societários, MEI vs ME, alvará, obrigações fiscais e escalonamento da operação.", duration: 5, content: "Módulo 1: MEI/ME; Módulo 2: Obrigações fiscais; Módulo 3: Escalonamento", pointsValue: 100, rating: 4.7 },

  // ── MANUAL DE BOAS PRÁTICAS NEXORA (OBRIGATÓRIO) ───────────────────
  {
    category: "Manual Nexora Field AI",
    specialty: "Nexora",
    level: "iniciante",
    title: "Manual de Boas Práticas Nexora Field AI",
    description: "Curso obrigatório para todos os técnicos cadastrados. Apresentação profissional, comunicação, segurança, evidências, relatórios e ética profissional.",
    duration: 7,
    content: "Módulo 1: Apresentação profissional e EPIs; Módulo 2: Comunicação com clientes; Módulo 3: Boas práticas em instalações; Módulo 4: Segurança NR10/NR35; Módulo 5: Evidências fotográficas; Módulo 6: Relatórios técnicos; Módulo 7: Conduta ética.",
    pointsValue: 300,
    isMandatory: true,
    rating: 4.9,
  },
];

export async function seedAcademy() {
  try {
    console.log("🎓 Seeding academy courses...");
    const [{ value: existing }] = await db.select({ value: count() }).from(academyCoursesTable);
    if (Number(existing) > 0) {
      console.log(`✅ Academy already seeded (${existing} courses) — skipping.`);
      return;
    }

    for (const course of COURSES) {
      await db.insert(academyCoursesTable).values({
        title: course.title,
        description: course.description,
        specialty: course.specialty,
        category: course.category,
        level: course.level,
        duration: course.duration,
        content: course.content,
        published: true,
        enrollments: Math.floor(Math.random() * 300) + 20,
        rating: course.rating,
        pointsValue: course.pointsValue,
        isMandatory: course.isMandatory ?? false,
      });
    }

    console.log(`✅ Academy seeded successfully! ${COURSES.length} courses created.`);
  } catch (err) {
    console.error("❌ Failed to seed academy:", err);
  }
}
