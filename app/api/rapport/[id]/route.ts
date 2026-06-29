import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { uploadPublic } from "@/lib/supabase";
import { getSociete } from "@/lib/params";
import { totaux } from "@/lib/format";
import { RapportPDF } from "@/pdf/RapportPDF";
import React from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const i = await prisma.intervention.findUnique({
    where: { id: params.id },
    include: { travaux: true },
  });
  if (!i) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const societe = await getSociete();
  const baseHT = i.travaux.reduce((s, t) => s + t.total, 0);
  const { ttc } = totaux(baseHT, societe.tauxTva);

  const buf = await renderToBuffer(
    React.createElement(RapportPDF, {
      d: {
        societe,
        reference: i.reference,
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(i.createdAt),
        client: i.client,
        adresse: i.adresse,
        ville: i.ville,
        codePostal: i.codePostal,
        typeService: i.typeService,
        notes: i.notes,
        photosAvant: i.photosAvant,
        photosApres: i.photosApres,
        travaux: i.travaux.map((t) => ({ libelle: t.libelle, quantite: t.quantite, prixUnitaire: t.prixUnitaire, total: t.total })),
        ttc,
      },
    }) as any
  );

  const url = await uploadPublic(`interventions/${i.id}/rapport-${i.reference}.pdf`, buf, "application/pdf");
  await prisma.intervention.update({ where: { id: i.id }, data: { rapportUrl: url } });
  return NextResponse.json({ url });
}
