import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { getSociete } from "@/lib/params";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req: Request) {
  const { interventionId, to } = await req.json();
  const i = await prisma.intervention.findUnique({ where: { id: interventionId }, include: { facture: true } });
  if (!i) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  if (!to) return NextResponse.json({ error: "Adresse email manquante" }, { status: 400 });
  if (!i.rapportUrl || !i.facture?.pdfUrl) {
    return NextResponse.json({ error: "Rapport ou facture non généré" }, { status: 400 });
  }

  const societe = await getSociete();
  const [rapport, facture] = await Promise.all([fetchBuffer(i.rapportUrl), fetchBuffer(i.facture.pdfUrl)]);

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a">
      <h2 style="color:#0891B2">${societe.raisonSociale}</h2>
      <p>Bonjour ${i.client},</p>
      <p>Suite à notre intervention (${i.typeService}) du ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(i.createdAt)},
      vous trouverez ci-joint votre <b>rapport d'intervention</b> et votre <b>facture</b>${i.montantTTC ? ` d'un montant de <b>${euro(i.montantTTC)}</b>` : ""}.</p>
      <p>Nous vous remercions de votre confiance.</p>
      <p style="color:#555;font-size:13px">${societe.raisonSociale} — ${societe.tel} — ${societe.email}</p>
    </div>`;

  try {
    await sendEmail({
      to,
      subject: `${societe.raisonSociale} — Rapport & facture (${i.reference})`,
      html,
      attachments: [
        { filename: `Rapport-${i.reference}.pdf`, content: rapport },
        { filename: `Facture-${i.facture.numero}.pdf`, content: facture },
      ],
    });
    await prisma.intervention.update({ where: { id: i.id }, data: { statut: "ENVOYEE" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
