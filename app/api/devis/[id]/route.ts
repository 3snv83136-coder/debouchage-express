import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { uploadPublic } from "@/lib/supabase";
import { getSociete } from "@/lib/params";
import { totaux } from "@/lib/format";
import { DevisPDF } from "@/pdf/DevisPDF";
import React from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function numeroDevis(n: number) {
  return `DEVIS-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const i = await prisma.intervention.findUnique({
      where: { id: params.id },
      include: { travaux: true, devis: true },
    });
    if (!i) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const societe = await getSociete();

    // Lignes = travaux supplémentaires. Si aucun, ligne unique = prestation principale au prixMin du tarif.
    let lignes = i.travaux.map((t) => ({ libelle: t.libelle, quantite: t.quantite, prixUnitaire: t.prixUnitaire, total: t.total }));
    if (lignes.length === 0) {
      const tarif = await prisma.tarif.findFirst({ where: { label: i.typeService } });
      const pu = tarif?.prixMin ?? 0;
      lignes = [{ libelle: i.typeService, quantite: 1, prixUnitaire: pu, total: pu }];
    }

    // ⚠️ Convention : prix saisis = HT. TVA ajoutée par-dessus.
    const baseHT = lignes.reduce((s, l) => s + l.total, 0);
    const { ht, tva, ttc } = totaux(baseHT, societe.tauxTva);

    const numero = i.devis?.numero ?? numeroDevis((await prisma.devis.count()) + 1);
    const now = new Date();
    const valide = new Date(now);
    valide.setDate(valide.getDate() + 30); // validité 30 jours
    const dateFmt = (dd: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(dd);

    const buf = await renderToBuffer(
      React.createElement(DevisPDF, {
        d: {
          societe,
          numero,
          date: dateFmt(now),
          valideJusquau: dateFmt(valide),
          client: i.client,
          clientAdresse: i.adresse,
          clientVille: i.ville,
          clientCp: i.codePostal,
          lignes,
          ht, tva, ttc,
        },
      }) as any
    );

    const pdfUrl = await uploadPublic(`interventions/${i.id}/devis-${numero}.pdf`, buf, "application/pdf");

    await prisma.devis.upsert({
      where: { interventionId: i.id },
      update: { montantHT: ht, montantTVA: tva, montantTTC: ttc, pdfUrl, valideJusquau: valide },
      create: { numero, interventionId: i.id, montantHT: ht, montantTVA: tva, montantTTC: ttc, pdfUrl, valideJusquau: valide },
    });

    return NextResponse.json({ numero, url: pdfUrl, ttc });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Génération du devis impossible (base/Storage non configuré)" },
      { status: 503 }
    );
  }
}
