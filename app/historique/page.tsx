import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HistoriqueClient, type DocItem } from "@/components/HistoriqueClient";

export const dynamic = "force-dynamic";

const DEMO_DOCS: DocItem[] = [
  {
    key: "demo-d1", type: "devis", numero: "DEVIS-2026-0001", interventionId: "demo-1",
    client: "M. Dupont", clientTel: "06 12 34 56 78", clientEmail: "dupont@email.fr",
    date: new Date().toISOString(), montantTTC: 198, statut: "ENVOYE", pdfUrl: null,
  },
  {
    key: "demo-f1", type: "facture", numero: "FACT-2026-0002", interventionId: "demo-2",
    client: "Mme Martin", clientTel: "06 98 76 54 32", clientEmail: "martin@email.fr",
    date: new Date().toISOString(), montantTTC: 352, statut: "ENVOYEE", pdfUrl: null,
  },
  {
    key: "demo-f2", type: "facture", numero: "FACT-2026-0001", interventionId: "demo-3",
    client: "SCI Bellecour", clientTel: "06 11 22 33 44", clientEmail: null,
    date: new Date(Date.now() - 864e5).toISOString(), montantTTC: 264, statut: "ENVOYEE", pdfUrl: null,
  },
];

export default async function HistoriquePage() {
  let docs: DocItem[];
  let demo = false;

  try {
    const interventions = await prisma.intervention.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { facture: true, devis: true },
    });

    docs = [];
    for (const i of interventions) {
      if (i.devis) {
        docs.push({
          key: `devis-${i.devis.id}`, type: "devis", numero: i.devis.numero, interventionId: i.id,
          client: i.client, clientTel: i.clientTel, clientEmail: i.clientEmail,
          date: i.devis.creeLe.toISOString(), montantTTC: i.devis.montantTTC,
          statut: i.devis.statut, pdfUrl: i.devis.pdfUrl,
        });
      }
      if (i.facture) {
        docs.push({
          key: `facture-${i.facture.id}`, type: "facture", numero: i.facture.numero, interventionId: i.id,
          client: i.client, clientTel: i.clientTel, clientEmail: i.clientEmail,
          date: i.facture.emiseLe.toISOString(), montantTTC: i.facture.montantTTC,
          statut: i.statut, pdfUrl: i.facture.pdfUrl,
        });
      }
    }

    if (docs.length === 0) {
      docs = DEMO_DOCS;
      demo = true;
    }
  } catch {
    docs = DEMO_DOCS;
    demo = true;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Historique — Devis & Factures</h1>
        <Link href="/" className="text-sm text-brand">← Accueil</Link>
      </div>
      <HistoriqueClient docs={docs} demo={demo} />
    </div>
  );
}
