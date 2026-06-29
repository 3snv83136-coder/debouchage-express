import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json();
  const data: any = {};

  if (Array.isArray(b.photosAvant)) data.photosAvant = b.photosAvant;
  if (Array.isArray(b.photosApres)) data.photosApres = b.photosApres;
  if (b.statut) data.statut = b.statut;
  if (b.notes !== undefined) data.notes = b.notes;

  // Remplace les travaux supplémentaires
  if (Array.isArray(b.travaux)) {
    await prisma.travauxSupplementaire.deleteMany({ where: { interventionId: params.id } });
    if (b.travaux.length) {
      await prisma.travauxSupplementaire.createMany({
        data: b.travaux.map((t: any) => ({
          interventionId: params.id,
          libelle: t.libelle,
          quantite: Number(t.quantite) || 1,
          prixUnitaire: Number(t.prixUnitaire) || 0,
          total: (Number(t.quantite) || 1) * (Number(t.prixUnitaire) || 0),
        })),
      });
    }
  }

  const updated = await prisma.intervention.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const i = await prisma.intervention.findUnique({
    where: { id: params.id },
    include: { travaux: true, facture: true },
  });
  if (!i) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(i);
}
