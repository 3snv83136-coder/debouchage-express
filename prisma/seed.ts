import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ⚠️ NAP en PLACEHOLDER — à remplacer dès réception des infos Débouchage Express
const PARAMETRES: { cle: string; valeur: string }[] = [
  { cle: "RAISON_SOCIALE", valeur: "Débouchage Express" },
  { cle: "ADRESSE", valeur: "[ADRESSE À COMPLÉTER]" },
  { cle: "CODE_POSTAL", valeur: "[CP]" },
  { cle: "VILLE", valeur: "[VILLE]" },
  { cle: "TEL_PRINCIPAL", valeur: "[TÉLÉPHONE À COMPLÉTER]" },
  { cle: "EMAIL_CONTACT", valeur: "contact@debouchage-express.fr" },
  { cle: "SIRET", valeur: "[SIRET À COMPLÉTER]" },
  { cle: "TVA", valeur: "[N° TVA À COMPLÉTER]" },
  { cle: "TAUX_TVA", valeur: "10" }, // travaux d'entretien logement = 10 % (à confirmer compta)
  { cle: "IBAN", valeur: "[IBAN À COMPLÉTER]" },
];

// Tarifs placeholder — valeurs à valider, jamais générées par IA
const TARIFS = [
  { type: "DEPLACEMENT", label: "Déplacement et diagnostic", prixMin: 49, prixMax: 49 },
  { type: "DEBOUCHAGE_MANUEL", label: "Débouchage manuel (furet)", prixMin: 99, prixMax: 180 },
  { type: "HYDROCURAGE", label: "Hydrocurage haute pression", prixMin: 250, prixMax: 450 },
  { type: "CAMERA", label: "Inspection caméra", prixMin: 150, prixMax: 250 },
  { type: "DEBOUCHAGE_WC", label: "Débouchage WC / sanitaires", prixMin: 90, prixMax: 160 },
];

async function main() {
  for (const p of PARAMETRES) {
    await prisma.parametre.upsert({ where: { cle: p.cle }, update: { valeur: p.valeur }, create: p });
  }
  for (const t of TARIFS) {
    await prisma.tarif.upsert({ where: { type: t.type }, update: t, create: t });
  }
  await prisma.technicien.upsert({
    where: { id: "tech-default" },
    update: {},
    create: { id: "tech-default", nom: "Intervenant", prenom: "Terrain", telephone: "[TEL]", actif: true },
  });
  console.log("✅ Seed terminé (NAP + tarifs placeholder)");
}

main().finally(() => prisma.$disconnect());
