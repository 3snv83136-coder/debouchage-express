import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { uploadPublic } from "@/lib/supabase";
import { getSociete } from "@/lib/params";
import { totaux } from "@/lib/format";
import { FacturePDF } from "@/pdf/FacturePDF";
import React from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function numeroFacture(n: number) {
  return `FACT-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const i = await prisma.intervention.findUnique({
    where: { id: params.id },
    include: { travaux: true, facture: true },
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

  // ⚠️ Convention sprint 1 : prix saisis = HT. TVA ajoutée par-dessus.
  const baseHT = lignes.reduce((s, l) => s + l.total, 0);
  const { ht, tva, ttc } = totaux(baseHT, societe.tauxTva);

  // Numérotation séquentielle annuelle
  const numero = i.facture?.numero ?? numeroFacture((await prisma.facture.count()) + 1);

  const buf = await renderToBuffer(
    React.createElement(FacturePDF, {
      d: {
        societe,
        numero,
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date()),
        client: i.client,
        clientAdresse: i.adresse,
        clientVille: i.ville,
        clientCp: i.codePostal,
        lignes,
        ht, tva, ttc,
      },
    }) as any
  );

  const pdfUrl = await uploadPublic(`interventions/${i.id}/facture-${numero}.pdf`, buf, "application/pdf");

  await prisma.facture.upsert({
    where: { interventionId: i.id },
    update: { montantHT: ht, montantTVA: tva, montantTTC: ttc, pdfUrl },
    create: { numero, interventionId: i.id, montantHT: ht, montantTVA: tva, montantTTC: ttc, pdfUrl },
  });
  await prisma.intervention.update({
    where: { id: i.id },
    data: { montantHT: ht, montantTVA: tva, montantTTC: ttc },
  });

  return NextResponse.json({ numero, url: pdfUrl, ttc });
}
