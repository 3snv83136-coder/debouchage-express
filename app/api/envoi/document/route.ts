import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { sendSms } from "@/lib/sms";
import { getSociete } from "@/lib/params";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

type DocType = "facture" | "devis" | "rapport";

export async function POST(req: Request) {
  try {
    const { interventionId, type, canal, to } = (await req.json()) as {
      interventionId: string;
      type: DocType;
      canal: "email" | "sms";
      to: string;
    };

    if (!to) return NextResponse.json({ error: "Destinataire manquant" }, { status: 400 });

    const i = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { facture: true, devis: true },
    });
    if (!i) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });

    const societe = await getSociete();

    const doc: { url: string | null; libelle: string; numero: string } =
      type === "facture"
        ? { url: i.facture?.pdfUrl ?? null, libelle: "facture", numero: i.facture?.numero ?? i.reference }
        : type === "devis"
        ? { url: i.devis?.pdfUrl ?? null, libelle: "devis", numero: i.devis?.numero ?? i.reference }
        : { url: i.rapportUrl, libelle: "rapport", numero: i.reference };

    if (!doc.url) {
      return NextResponse.json({ error: `Aucun ${doc.libelle} généré pour cette intervention` }, { status: 400 });
    }

    if (canal === "sms") {
      const message =
        `${societe.raisonSociale}\n` +
        `Bonjour ${i.client}, voici votre ${doc.libelle} (${doc.numero}) :\n${doc.url}`;
      const res = await sendSms(to, message);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
      return NextResponse.json({ ok: true, id: res.id });
    }

    // canal email — avec pièce jointe
    const buf = await fetchBuffer(doc.url);
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1a1a1a">
        <h2 style="color:#0891B2">${societe.raisonSociale}</h2>
        <p>Bonjour ${i.client},</p>
        <p>Vous trouverez ci-joint votre <b>${doc.libelle}</b> (${doc.numero})${
          i.montantTTC ? ` d'un montant de <b>${euro(i.montantTTC)}</b>` : ""
        }.</p>
        <p>Nous restons à votre disposition.</p>
        <p style="color:#555;font-size:13px">${societe.raisonSociale} — ${societe.tel} — ${societe.email}</p>
      </div>`;

    await sendEmail({
      to,
      subject: `${societe.raisonSociale} — Votre ${doc.libelle} (${doc.numero})`,
      html,
      attachments: [{ filename: `${doc.libelle}-${doc.numero}.pdf`, content: buf }],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Renvoi impossible (base/email non configuré)" },
      { status: 503 }
    );
  }
}
