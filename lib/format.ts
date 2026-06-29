export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export const dateFR = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(d));

/** Calcule HT/TVA/TTC à partir d'un montant HT et d'un taux (%). */
export function totaux(montantHT: number, tauxTva: number) {
  const tva = Math.round(montantHT * (tauxTva / 100) * 100) / 100;
  const ttc = Math.round((montantHT + tva) * 100) / 100;
  return { ht: montantHT, tva, ttc };
}
