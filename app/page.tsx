import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { euro, dateFR } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUT_STYLE: Record<string, string> = {
  EN_COURS: "bg-amber-100 text-amber-800",
  TERMINEE: "bg-blue-100 text-blue-800",
  ENVOYEE: "bg-green-100 text-green-800",
  ANNULEE: "bg-slate-200 text-slate-600",
};

type DashboardRow = {
  id: string;
  client: string;
  ville: string;
  typeService: string;
  createdAt: Date;
  statut: string;
  montantTTC: number | null;
};

// Données de démonstration affichées si la base n'est pas configurée (preview visuel en local).
const DEMO_INTERVENTIONS: DashboardRow[] = [
  { id: "demo-1", client: "M. Dupont", ville: "Lyon", typeService: "Débouchage canalisation", createdAt: new Date(), statut: "EN_COURS", montantTTC: 180 },
  { id: "demo-2", client: "Mme Martin", ville: "Villeurbanne", typeService: "Hydrocurage", createdAt: new Date(), statut: "TERMINEE", montantTTC: 320 },
  { id: "demo-3", client: "SCI Bellecour", ville: "Lyon", typeService: "Inspection caméra", createdAt: new Date(Date.now() - 864e5), statut: "ENVOYEE", montantTTC: 240 },
];

export default async function Dashboard() {
  let interventions: DashboardRow[];
  let demo = false;
  try {
    interventions = await prisma.intervention.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { facture: true },
    });
  } catch {
    interventions = DEMO_INTERVENTIONS;
    demo = true;
  }

  const stats = {
    jour: interventions.filter((i) => new Date(i.createdAt).toDateString() === new Date().toDateString()).length,
    enCours: interventions.filter((i) => i.statut === "EN_COURS").length,
    caJour: interventions
      .filter((i) => new Date(i.createdAt).toDateString() === new Date().toDateString())
      .reduce((s, i) => s + (i.montantTTC ?? 0), 0),
  };

  return (
    <div className="space-y-5">
      {demo && (
        <p className="rounded-lg border border-accent/30 bg-accent-light px-3 py-2 text-xs font-medium text-accent-dark">
          Mode démonstration — aucune base de données configurée (DATABASE_URL). Les données ci-dessous sont fictives.
        </p>
      )}

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Interventions du jour" value={String(stats.jour)} />
        <Stat label="En cours" value={String(stats.enCours)} />
        <Stat label="CA du jour" value={euro(stats.caJour)} />
      </section>

      <Link
        href="/intervention/nouvelle"
        className="flex items-center justify-center rounded-xl bg-brand-gradient px-4 py-4 text-center text-base font-semibold text-white shadow-md shadow-brand/30 transition active:scale-[.99]"
      >
        🚐 Démarrer une intervention (mode tout-terrain)
      </Link>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Dernières interventions</h2>
        {interventions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Aucune intervention pour l'instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {interventions.map((i) => (
              <li key={i.id}>
                {demo ? (
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm opacity-90">
                    <div>
                      <p className="font-medium">{i.client}</p>
                      <p className="text-xs text-slate-500">
                        {i.ville} · {i.typeService} · {dateFR(i.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[i.statut] ?? ""}`}>
                        {i.statut}
                      </span>
                      {i.montantTTC ? <p className="mt-1 text-sm font-semibold">{euro(i.montantTTC)}</p> : null}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/intervention/${i.id}`}
                    className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium">{i.client}</p>
                      <p className="text-xs text-slate-500">
                        {i.ville} · {i.typeService} · {dateFR(i.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLE[i.statut] ?? ""}`}>
                        {i.statut}
                      </span>
                      {i.montantTTC ? <p className="mt-1 text-sm font-semibold">{euro(i.montantTTC)}</p> : null}
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand">{value}</p>
    </div>
  );
}
