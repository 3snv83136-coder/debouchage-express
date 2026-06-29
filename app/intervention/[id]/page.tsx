import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { euro, dateFR } from "@/lib/format";
import { EnvoiPanel } from "@/components/EnvoiPanel";

export const dynamic = "force-dynamic";

export default async function InterventionDetail({ params }: { params: { id: string } }) {
  const i = await prisma.intervention.findUnique({
    where: { id: params.id },
    include: { facture: true, travaux: true },
  });
  if (!i) notFound();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-brand">← Tableau de bord</Link>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold">{i.client}</h1>
            <p className="text-sm text-slate-500">{i.adresse}, {i.codePostal} {i.ville}</p>
            <p className="text-sm text-slate-500">{i.clientTel}{i.clientEmail ? ` · ${i.clientEmail}` : ""}</p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">{i.statut}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Info label="Référence" value={i.reference} />
          <Info label="Date" value={dateFR(i.createdAt)} />
          <Info label="Prestation" value={i.typeService} />
          <Info label="Montant TTC" value={i.montantTTC ? euro(i.montantTTC) : "—"} />
        </div>
      </div>

      {i.travaux.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Travaux supplémentaires</h2>
          <ul className="text-sm">
            {i.travaux.map((t) => (
              <li key={t.id} className="flex justify-between border-b border-slate-100 py-1">
                <span>{t.libelle} ×{t.quantite}</span><b>{euro(t.total)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <PhotoCol title="Avant" photos={i.photosAvant} />
        <PhotoCol title="Après" photos={i.photosApres} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Documents</h2>
        <div className="flex flex-wrap gap-2">
          {i.rapportUrl
            ? <a href={i.rapportUrl} target="_blank" className="rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand">📄 Rapport</a>
            : <span className="text-sm text-slate-400">Rapport non généré</span>}
          {i.facture?.pdfUrl
            ? <a href={i.facture.pdfUrl} target="_blank" className="rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand">🧾 Facture {i.facture.numero}</a>
            : <span className="text-sm text-slate-400">Facture non générée</span>}
        </div>
      </div>

      <EnvoiPanel
        id={i.id}
        clientTel={i.clientTel}
        clientEmail={i.clientEmail}
        rapportUrl={i.rapportUrl}
        factureUrl={i.facture?.pdfUrl ?? null}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="font-medium">{value}</p></div>;
}

function PhotoCol({ title, photos }: { title: string; photos: string[] }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-500">{title}</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {photos.length === 0 ? <p className="col-span-2 text-xs text-slate-400">Aucune photo</p> :
          // eslint-disable-next-line @next/next/no-img-element
          photos.map((u, k) => <img key={k} src={u} alt="" className="aspect-square w-full rounded object-cover" />)}
      </div>
    </div>
  );
}
