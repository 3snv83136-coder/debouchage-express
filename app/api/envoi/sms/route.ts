import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { getSociete } from "@/lib/params";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { interventionId, to } = await req.json();
  const i = await prisma.intervention.findUnique({ where: { id: interventionId }, include: { facture: true } });
  if (!i) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  if (!to) return NextResponse.json({ error: "Numéro manquant" }, { status: 400 });
  if (!i.rapportUrl || !i.facture?.pdfUrl) {
    return NextResponse.json({ error: "Rapport ou facture non généré" }, { status: 400 });
  }

  const societe = await getSociete();
  const message =
    `${societe.raisonSociale}\n` +
    `Merci ${i.client}. Votre rapport : ${i.rapportUrl}\n` +
    `Votre facture : ${i.facture.pdfUrl}`;

  const res = await sendSms(to, message);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });

  await prisma.intervention.update({ where: { id: i.id }, data: { statut: "ENVOYEE" } });
  return NextResponse.json({ ok: true, id: res.id });
}
