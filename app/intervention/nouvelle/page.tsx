import { getTarifs } from "@/lib/params";
import { ModeTerrain } from "@/components/ModeTerrain";

export const dynamic = "force-dynamic";

// Tarifs de démonstration si la base n'est pas configurée (preview visuel en local).
const DEMO_TARIFS = [
  { type: "DEBOUCHAGE_MANUEL", label: "Débouchage canalisation", prixMin: 120, prixMax: 250 },
  { type: "HYDROCURAGE", label: "Hydrocurage", prixMin: 250, prixMax: 500 },
  { type: "CAMERA", label: "Inspection caméra", prixMin: 150, prixMax: 300 },
  { type: "DEPLACEMENT", label: "Déplacement", prixMin: 40, prixMax: 80 },
];

export default async function NouvelleIntervention() {
  let tarifs;
  try {
    const rows = await getTarifs();
    tarifs = rows.length
      ? rows.map((t) => ({ type: t.type, label: t.label, prixMin: t.prixMin, prixMax: t.prixMax }))
      : DEMO_TARIFS;
  } catch {
    tarifs = DEMO_TARIFS;
  }

  return <ModeTerrain tarifs={tarifs} />;
}
