import { Router, type Response } from "express";
import PDFDocument from "pdfkit";
import { db, serviceOrdersTable, techniciansTable, companiesTable, checkinCheckoutsTable, serviceEvidencesTable, ratingsTable } from "@workspace/db";
import { eq, and, avg, count, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const BRAND_COLOR = "#0A84FF";
const DARK_BG = "#121c2e";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatCurrency(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function drawHeader(doc: InstanceType<typeof PDFDocument>, title: string) {
  doc.rect(0, 0, doc.page.width, 80).fill(DARK_BG);
  doc.fontSize(22).fillColor("#FFFFFF").text("NEXORA FIELD AI", 40, 20, { continued: false });
  doc.fontSize(11).fillColor("#8EDB65").text(title, 40, 48);
  doc.fillColor("#000000");
  doc.y = 100;
}

function drawSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 24).fill(BRAND_COLOR);
  doc.fontSize(11).fillColor("#FFFFFF").text(title, 48, doc.y - 18);
  doc.fillColor("#222222");
  doc.moveDown(0.8);
}

function drawField(doc: InstanceType<typeof PDFDocument>, label: string, value: string) {
  doc.fontSize(9).fillColor("#555555").text(label + ":", { continued: true });
  doc.fillColor("#111111").text("  " + value);
}

function drawFooter(doc: InstanceType<typeof PDFDocument>, orderId?: string | number) {
  const bottom = doc.page.height - 40;
  doc.fontSize(8).fillColor("#999999").text(
    `Nexora Field AI — Gerado em ${new Date().toLocaleString("pt-BR")}${orderId ? " — OS #" + orderId : ""}`,
    40, bottom, { align: "center", width: doc.page.width - 80 }
  );
}

router.get("/reports/technical/:orderId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["orderId"] as string);
    if (isNaN(orderId)) { res.status(400).json({ error: "ID inválido." }); return; }

    const [order] = await db
      .select({
        order: serviceOrdersTable,
        technician: techniciansTable,
        company: companiesTable,
      })
      .from(serviceOrdersTable)
      .leftJoin(techniciansTable, eq(serviceOrdersTable.technicianId, techniciansTable.userId))
      .leftJoin(companiesTable, eq(serviceOrdersTable.companyId, companiesTable.userId))
      .where(eq(serviceOrdersTable.id, orderId))
      .limit(1);

    if (!order) { res.status(404).json({ error: "Chamado não encontrado." }); return; }

    const user = req.user!;
    const isAdmin = user.role === "admin" || user.role === "admin_master";
    const isOwnerCompany = user.role === "company" && order.order.companyId === user.id;
    const isOwnerTech = user.role === "technician" && order.order.technicianId === user.id;
    if (!isAdmin && !isOwnerCompany && !isOwnerTech) {
      res.status(403).json({ error: "Acesso negado." }); return;
    }

    const [checkin] = await db.select().from(checkinCheckoutsTable).where(eq(checkinCheckoutsTable.serviceOrderId, orderId)).limit(1);
    const evidences = await db.select().from(serviceEvidencesTable).where(eq(serviceEvidencesTable.serviceOrderId, orderId));

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=relatorio-tecnico-OS${orderId}.pdf`);
    doc.pipe(res);

    drawHeader(doc, "RELATÓRIO TÉCNICO DE SERVIÇO");

    drawSectionTitle(doc, "DADOS DO CHAMADO");
    drawField(doc, "OS", `#${order.order.id}`);
    drawField(doc, "Status", order.order.status?.toUpperCase() ?? "—");
    drawField(doc, "Categoria", order.order.category ?? "—");
    drawField(doc, "Descrição", order.order.description ?? "—");
    drawField(doc, "Localização", [order.order.address, order.order.city, order.order.state].filter(Boolean).join(", ") || "—");
    drawField(doc, "SLA", order.order.slaHours ? `${order.order.slaHours}h` : "—");
    drawField(doc, "Valor", formatCurrency(order.order.value));
    drawField(doc, "Criado em", formatDate(order.order.createdAt));

    drawSectionTitle(doc, "EMPRESA SOLICITANTE");
    drawField(doc, "Razão Social", order.company?.razaoSocial ?? "—");
    drawField(doc, "Nome Fantasia", order.company?.nomeFantasia ?? "—");
    drawField(doc, "CNPJ", order.company?.cnpj ?? "—");
    drawField(doc, "Cidade", [order.company?.city, order.company?.state].filter(Boolean).join(" / ") || "—");

    drawSectionTitle(doc, "TÉCNICO RESPONSÁVEL");
    if (order.technician) {
      drawField(doc, "Nome", order.technician.name ?? "—");
      drawField(doc, "CPF", order.technician.cpf ?? "—");
      drawField(doc, "Telefone", order.technician.phone ?? "—");
      drawField(doc, "Especialidades", (order.technician.specialties ?? []).join(", ") || "—");
      drawField(doc, "Avaliação", order.technician.rating ? `${Number(order.technician.rating).toFixed(1)} / 5.0` : "—");
    } else {
      doc.fontSize(9).fillColor("#888888").text("Técnico não atribuído.");
    }

    drawSectionTitle(doc, "EXECUÇÃO DO SERVIÇO");
    if (checkin) {
      drawField(doc, "Check-in", formatDate(checkin.checkinAt));
      drawField(doc, "Coord. Check-in", checkin.checkinLatitude ? `${checkin.checkinLatitude}, ${checkin.checkinLongitude}` : "—");
      drawField(doc, "Checkout", formatDate(checkin.checkoutAt));
      drawField(doc, "Coord. Checkout", checkin.checkoutLatitude ? `${checkin.checkoutLatitude}, ${checkin.checkoutLongitude}` : "—");
      drawField(doc, "Duração", checkin.durationMinutes ? `${checkin.durationMinutes} minutos` : "—");
      if (checkin.notes) drawField(doc, "Observações", checkin.notes);
    } else {
      doc.fontSize(9).fillColor("#888888").text("Serviço ainda não executado.");
    }

    drawSectionTitle(doc, "EVIDÊNCIAS");
    if (evidences.length > 0) {
      evidences.forEach((ev, i) => {
        drawField(doc, `Evidência ${i + 1}`, ev.description ?? ev.fileUrl ?? "—");
      });
    } else {
      doc.fontSize(9).fillColor("#888888").text("Nenhuma evidência registrada.");
    }

    drawFooter(doc, orderId);
    doc.end();
  } catch (err: any) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar relatório." });
  }
});

router.get("/reports/executive", requireAuth, requireRole("admin", "admin_master", "company"), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === "admin" || user.role === "admin_master";

    const whereClause = isAdmin ? undefined : eq(serviceOrdersTable.companyId, user.id);

    const [metrics] = await db
      .select({
        total: count(),
        gmv: sql<number>`COALESCE(SUM(${serviceOrdersTable.value}), 0)`,
        avgValue: avg(serviceOrdersTable.value),
        finalizados: sql<number>`COUNT(*) FILTER (WHERE ${serviceOrdersTable.status} = 'finalizado')`,
        cancelados: sql<number>`COUNT(*) FILTER (WHERE ${serviceOrdersTable.status} = 'cancelado')`,
        abertos: sql<number>`COUNT(*) FILTER (WHERE ${serviceOrdersTable.status} = 'aberto')`,
        emAndamento: sql<number>`COUNT(*) FILTER (WHERE ${serviceOrdersTable.status} = 'em_andamento')`,
      })
      .from(serviceOrdersTable)
      .where(whereClause ?? sql`1=1`);

    const [ratingMetrics] = await db
      .select({ avgRating: avg(ratingsTable.score), totalRatings: count() })
      .from(ratingsTable);

    const slaData = await db
      .select({
        slaHours: serviceOrdersTable.slaHours,
        duration: checkinCheckoutsTable.durationMinutes,
        status: serviceOrdersTable.status,
      })
      .from(serviceOrdersTable)
      .leftJoin(checkinCheckoutsTable, eq(serviceOrdersTable.id, checkinCheckoutsTable.serviceOrderId))
      .where(whereClause ?? sql`1=1`);

    const total = Number(metrics?.total ?? 0);
    const finalizados = Number(metrics?.finalizados ?? 0);
    const cancelados = Number(metrics?.cancelados ?? 0);
    const gmv = Number(metrics?.gmv ?? 0);
    const avgVal = Number(metrics?.avgValue ?? 0);
    const taxaConversao = total > 0 ? ((finalizados / total) * 100).toFixed(1) : "0";
    const slaCompliance = slaData.length > 0
      ? slaData.filter(s => {
          if (!s.slaHours || !s.duration) return false;
          return (s.duration / 60) <= s.slaHours;
        }).length / slaData.filter(s => s.slaHours && s.duration).length * 100
      : 0;

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=relatorio-executivo-${new Date().toISOString().slice(0, 10)}.pdf`);
    doc.pipe(res);

    drawHeader(doc, "RELATÓRIO EXECUTIVO");

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#555555").text(`Gerado para: ${isAdmin ? "Plataforma (visão global)" : "Empresa #" + user.id}`);
    doc.moveDown(0.3);

    drawSectionTitle(doc, "INDICADORES GERAIS");
    drawField(doc, "Total de Chamados", String(total));
    drawField(doc, "Finalizados", `${finalizados} (${taxaConversao}% de conversão)`);
    drawField(doc, "Cancelados", String(cancelados));
    drawField(doc, "Em aberto / Andamento", `${Number(metrics?.abertos ?? 0)} / ${Number(metrics?.emAndamento ?? 0)}`);

    drawSectionTitle(doc, "FINANCEIRO");
    drawField(doc, "GMV Total", formatCurrency(gmv));
    drawField(doc, "Ticket Médio", formatCurrency(avgVal));
    if (isAdmin) {
      drawField(doc, "Take Rate (15%)", formatCurrency(gmv * 0.15));
      drawField(doc, "MRR Estimado", formatCurrency(gmv * 0.12));
    }

    drawSectionTitle(doc, "SLA E QUALIDADE");
    drawField(doc, "Avaliação Média", ratingMetrics?.avgRating ? `${Number(ratingMetrics.avgRating).toFixed(2)} / 5.00` : "—");
    drawField(doc, "Total de Avaliações", String(ratingMetrics?.totalRatings ?? 0));
    drawField(doc, "Conformidade de SLA", slaCompliance > 0 ? `${slaCompliance.toFixed(1)}%` : "Dados insuficientes");

    drawSectionTitle(doc, "PRODUTIVIDADE");
    const comSla = slaData.filter(s => s.duration != null);
    const avgDuration = comSla.length > 0 ? comSla.reduce((a, b) => a + Number(b.duration ?? 0), 0) / comSla.length : 0;
    drawField(doc, "Tempo médio de execução", avgDuration > 0 ? `${Math.round(avgDuration)} minutos` : "—");
    drawField(doc, "Chamados com evidências", "Via sistema de evidências");

    drawFooter(doc);
    doc.end();
  } catch (err: any) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar relatório." });
  }
});

export default router;
