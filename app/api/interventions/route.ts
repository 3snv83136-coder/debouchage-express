import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function ref(prefix: string, n: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.client || !b.clientTel) {
      return NextResponse.json({ error: "Client et téléphone requis" }, { status: 400 });
    }
    const count = await prisma.intervention.count();
    const intervention = await prisma.intervention.create({
      data: {
        reference: ref("DEX", count + 1),
        client: b.client,
        clientTel: b.clientTel,
        clientEmail: b.clientEmail || null,
        adresse: b.adresse || "",
        ville: b.ville || "",
        codePostal: b.codePostal || "",
        typeService: b.typeService || "Débouchage",
        notes: b.notes || null,
        statut: "EN_COURS",
      },
    });
    return NextResponse.json({ id: intervention.id, reference: intervention.reference });
  } catch {
    return NextResponse.json(
      { error: "Base de données non configurée. Ajoutez DATABASE_URL dans un fichier .env" },
      { status: 503 }
    );
  }
}
