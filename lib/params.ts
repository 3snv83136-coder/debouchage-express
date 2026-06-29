import { prisma } from "@/lib/prisma";

/** Lit un paramètre NAP depuis la DB (jamais hardcodé — règle R1/R3). */
export async function getParam(cle: string): Promise<string> {
  const p = await prisma.parametre.findFirst({ where: { cle } });
  return p?.valeur ?? "";
}

/** Renvoie l'ensemble des paramètres société sous forme d'objet. */
export async function getSociete() {
  const rows = await prisma.parametre.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.cle, r.valeur]));
  return {
    raisonSociale: map.RAISON_SOCIALE ?? "Débouchage Express",
    adresse: map.ADRESSE ?? "",
    codePostal: map.CODE_POSTAL ?? "",
    ville: map.VILLE ?? "",
    tel: map.TEL_PRINCIPAL ?? "",
    email: map.EMAIL_CONTACT ?? "",
    siret: map.SIRET ?? "",
    tva: map.TVA ?? "",
    tauxTva: Number(map.TAUX_TVA ?? "10"),
    iban: map.IBAN ?? "",
  };
}

/** Tarifs actifs depuis la table Tarif (jamais hardcodé — règle R2). */
export async function getTarifs() {
  return prisma.tarif.findMany({ where: { actif: true }, orderBy: { label: "asc" } });
}
