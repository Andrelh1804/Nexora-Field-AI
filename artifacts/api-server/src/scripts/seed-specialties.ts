import { db } from "@workspace/db";
import {
  specialtyCategoriesTable,
  specialtySubcategoriesTable,
  specialtySkillsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const SEED = [
  {
    name: "Telecom",
    icon: "📡",
    description: "Telecomunicações, fibra óptica e redes ISP",
    sortOrder: 1,
    subcategories: [
      {
        name: "Fibra Óptica",
        skills: ["Fusão de fibra", "Emenda mecânica", "OTDR", "GPON / XGS-PON", "Projeto de rede óptica", "Certificação de fibra", "Splitter / DIO"],
      },
      {
        name: "Redes ISP",
        skills: ["Roteamento BGP", "MPLS", "MikroTik", "Cisco IOS", "Ubiquiti AirOS", "DHCP / PPPoE", "QoS"],
      },
      {
        name: "Rádio Enlace",
        skills: ["Alinhamento de antena", "Link budget", "Ubiquiti airMAX", "Mimosa", "Cambium", "Siklu (mmWave)"],
      },
      {
        name: "PABX / VoIP",
        skills: ["Asterisk", "3CX", "Yealink", "Grandstream", "SIP Trunk", "QoS VoIP"],
      },
    ],
  },
  {
    name: "TI / Suporte",
    icon: "💻",
    description: "Suporte técnico, redes corporativas e infraestrutura de TI",
    sortOrder: 2,
    subcategories: [
      {
        name: "Help Desk",
        skills: ["Help Desk N1", "Help Desk N2", "Help Desk N3", "Remote Desktop", "ITSM / GLPI", "ServiceNow", "Zendesk"],
      },
      {
        name: "Windows Server",
        skills: ["Active Directory", "Group Policy (GPO)", "DNS / DHCP", "File Server", "IIS", "Hyper-V", "Windows Server 2019/2022"],
      },
      {
        name: "Linux",
        skills: ["Ubuntu Server", "CentOS / RHEL", "Shell Script (Bash)", "Nginx / Apache", "SSH / VPN", "Cron / Systemd"],
      },
      {
        name: "Redes Corporativas",
        skills: ["VLAN", "Spanning Tree", "Firewall (pfSense / Fortinet)", "Cisco Catalyst", "HP Aruba", "Wi-Fi corporativo", "802.1X"],
      },
      {
        name: "Microsoft 365 / Google",
        skills: ["Microsoft 365 Admin", "Exchange Online", "SharePoint", "Teams", "Google Workspace", "Intune / MDM"],
      },
    ],
  },
  {
    name: "Eletrônica",
    icon: "🔌",
    description: "Eletrônica analógica, digital, reparo e bancada",
    sortOrder: 3,
    subcategories: [
      {
        name: "Bancada Eletrônica",
        skills: ["Soldagem SMD", "Soldagem THT", "Diagnóstico de placas", "Reparo de fontes chaveadas", "Osciloscópio", "Multímetro avançado", "Estação de retrabalho"],
      },
      {
        name: "Equipamentos",
        skills: ["Reparo de nobreaks / UPS", "Reparo de impressoras", "Reparo de monitores", "Manutenção de servidores", "Manutenção de storages"],
      },
    ],
  },
  {
    name: "Automação Industrial",
    icon: "⚙️",
    description: "CLPs, SCADA, redes industriais e robótica",
    sortOrder: 4,
    subcategories: [
      {
        name: "CLPs",
        skills: ["Siemens S7 (TIA Portal)", "Allen-Bradley (Studio 5000)", "Schneider Modicon", "Ladder / FBD / ST", "Programação de CLP", "Manutenção de CLP"],
      },
      {
        name: "SCADA / IHM",
        skills: ["SCADA (WonderWare / iFix)", "IHM Siemens / Allen-Bradley", "Elipse E3", "Wonderware InTouch", "FactoryTalk View"],
      },
      {
        name: "Redes Industriais",
        skills: ["Modbus RTU / TCP", "PROFIBUS", "PROFINET", "EtherNet/IP", "DeviceNet", "CANopen"],
      },
      {
        name: "Instrumentação",
        skills: ["Sensores industriais", "Transmissores 4-20mA", "PT100 / Termopares", "Pressostatos / Vacuômetros", "Calibração de instrumentos"],
      },
    ],
  },
  {
    name: "Segurança Eletrônica",
    icon: "📹",
    description: "CFTV, controle de acesso e alarmes",
    sortOrder: 5,
    subcategories: [
      {
        name: "CFTV",
        skills: ["CFTV IP (Hikvision / Intelbras)", "CFTV HD-CVI / AHD", "Câmeras PTZ", "VMS (iVMS / Milestone)", "Armazenamento NVR / DVR", "Análise de vídeo / IA"],
      },
      {
        name: "Controle de Acesso",
        skills: ["Catraca biométrica", "Fechadura eletromagnética", "Leitor RFID", "Controle de acesso IP", "Integração CFTV + Acesso"],
      },
      {
        name: "Alarmes",
        skills: ["Central de alarme (Paradox / DSC)", "Sensores de presença / abertura", "Monitoramento via IP", "Cercas elétricas"],
      },
    ],
  },
  {
    name: "Energia Solar",
    icon: "☀️",
    description: "Sistemas fotovoltaicos, off-grid e manutenção",
    sortOrder: 6,
    subcategories: [
      {
        name: "Instalação Fotovoltaica",
        skills: ["Instalação on-grid", "Instalação off-grid", "Instalação híbrida", "Dimensionamento de sistema", "Cabeamento DC / AC", "String Box / Combiners"],
      },
      {
        name: "Inversores",
        skills: ["Fronius", "SMA", "Growatt", "Deye", "Huawei Solar", "SAJ", "WEG Solar"],
      },
      {
        name: "Manutenção Solar",
        skills: ["Limpeza de painéis", "Inspeção termográfica", "I-V Curve tracing", "Monitoramento SCADA solar", "Laudo técnico solar"],
      },
    ],
  },
  {
    name: "Cloud & DevOps",
    icon: "☁️",
    description: "Cloud computing, containers e automação de infra",
    sortOrder: 7,
    subcategories: [
      {
        name: "AWS",
        skills: ["EC2 / VPC", "S3 / CloudFront", "RDS / Aurora", "Lambda", "EKS / ECS", "IAM / Security", "CloudFormation / Terraform"],
      },
      {
        name: "Azure",
        skills: ["Azure VMs", "Azure AD", "Azure DevOps", "AKS", "Azure Functions", "ARM Templates / Bicep"],
      },
      {
        name: "Containers & Orquestração",
        skills: ["Docker", "Docker Compose", "Kubernetes (K8s)", "Helm Charts", "Rancher / OpenShift"],
      },
      {
        name: "CI/CD & DevOps",
        skills: ["GitHub Actions", "GitLab CI", "Jenkins", "Ansible", "Terraform", "Monitoring (Prometheus / Grafana)", "ELK Stack"],
      },
    ],
  },
  {
    name: "Infraestrutura",
    icon: "🏗️",
    description: "Cabeamento estruturado, data centers e facilities",
    sortOrder: 8,
    subcategories: [
      {
        name: "Cabeamento Estruturado",
        skills: ["Cat5e / Cat6 / Cat6A", "Certificação Fluke", "Patch panel", "Rack / armário de telecom", "Passagem de cabos / eletroduto", "Fusão e terminação de fibra"],
      },
      {
        name: "Data Center",
        skills: ["Infraestrutura de DC", "Raised floor", "Cooling (CRAC / CRAH)", "UPS / Nobreak industrial", "PDU / Energia redundante", "Cabeamento ANSI/TIA-942"],
      },
    ],
  },
];

export async function seedSpecialties() {
  console.log("🌱 Seeding specialties...");

  for (const catData of SEED) {
    // Upsert category
    const existing = await db
      .select()
      .from(specialtyCategoriesTable)
      .where(eq(specialtyCategoriesTable.name, catData.name))
      .limit(1);

    let cat = existing[0];
    if (!cat) {
      [cat] = await db
        .insert(specialtyCategoriesTable)
        .values({ name: catData.name, icon: catData.icon, description: catData.description, sortOrder: catData.sortOrder })
        .returning();
      console.log(`  ✓ Category: ${catData.icon} ${catData.name}`);
    }

    for (const subData of catData.subcategories) {
      // Upsert subcategory
      const existingSub = await db
        .select()
        .from(specialtySubcategoriesTable)
        .where(eq(specialtySubcategoriesTable.name, subData.name))
        .limit(1);

      let sub = existingSub[0];
      if (!sub) {
        [sub] = await db
          .insert(specialtySubcategoriesTable)
          .values({ categoryId: cat.id, name: subData.name })
          .returning();
        console.log(`    ✓ Subcategory: ${subData.name}`);
      }

      for (const skillName of subData.skills) {
        const existingSkill = await db
          .select()
          .from(specialtySkillsTable)
          .where(eq(specialtySkillsTable.name, skillName))
          .limit(1);

        if (!existingSkill[0]) {
          await db
            .insert(specialtySkillsTable)
            .values({ subcategoryId: sub.id, name: skillName })
            .returning();
        }
      }
      console.log(`      → ${subData.skills.length} skills`);
    }
  }

  console.log("✅ Specialties seeded successfully!");
}
