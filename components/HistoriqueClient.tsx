"use client";

import { useMemo, useState } from "react";
import { euro, dateFR } from "@/lib/format";

export type DocItem = {
  key: string;
  type: "devis" | "facture";
  numero: string;
  interventionId: string;
  client: string;
  clientTel: string;
  clientEmail: string | null;
  date: string;
  montantTTC: number | null;
  statut: string;
  pdfUrl: string | null;
};

const STATUT_STYLE: Record<string, string> = {
  ENVOYE: "bg-amber-100 text-amber-800",
  ENVOYEE: "bg-amber-100 text-amber-800",
  ACCEPTE: "bg-green-100 text-green-800",
  REFUSE: "bg-red-100 text-red-700",
  TERMINEE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-slate-200 text-slate-600",
};

export function HistoriqueClient({ docs, demo }: { docs: DocItem[]; demo: boolean }) {
  const [filtre, setFiltre] = useState<"tous" | "devis" | "facture">("tous");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const liste = useMemo(
    () => (filtre === "tous" ? docs : docs.filter((d) => d.type === filtre)),
    [docs, filtre]
  );

  async function renvoyer(d: DocItem, canal: "email" | "sms") {
    if (demo) {
      setMsg({ ok: false, text: "Mode démonstration : configurez la base et l'email pour renvoyer réellement." });
      return;
    }
    const defaut = canal === "email" ? d.clientEmail ?? "" : d.clientTel ?? "";
    const to = window.prompt(
      canal === "email" ? "Adresse email du destinataire :" : "Numéro de téléphone :",
      defaut
    );
    if (!to) return;

    setBusyKey(d.key + canal);
    setMsg(null);
    try {
      const res = await fetch("/api/envoi/document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interventionId: d.interventionId, type: d.type, canal, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec du renvoi");
      setMsg({ ok: true, text: `${d.type === "devis" ? "Devis" : "Facture"} ${d.numero} renvoyé ✓` });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {demo && (
        <p className="rounded-lg border border-accent/30 bg-accent-light px-3 py-2 text-xs font-medium text-accent-dark">
          Mode démonstration — aucune base de données configurée. Les documents ci-dessous sont fictifs.
        </p>
      )}

      <div className="flex gap-2">
        {(["tous", "devis", "facture"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filtre === f ? "bg-brand text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f === "tous" ? "Tous" : f === "devis" ? "Devis" : "Factures"}
          </button>
        ))}
      </div>

      {msg && (
        <p className={`rounded-lg p-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      {liste.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          Aucun document pour ce filtre.
        </p>
      ) : (
        <ul className="space-y-2">
          {liste.map((d) => (
            <li key={d.key} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        d.type === "devis" ? "bg-accent-light text-accent-dark" : "bg-brand-light text-brand-dark"
                      }`}
                    >
                      {d.type === "devis" ? "DEVIS" : "FACTURE"}
                    </span>
                    <span className="truncate text-sm font-semibold">{d.numero}</span>
                  </div>
                  <p className="mt-1 truncate text-sm">{d.client}</p>
                  <p className="text-xs text-slate-500">{dateFR(d.date)}</p>
                </div>
                <div className="text-right">
                  {d.montantTTC != null && (
                    <p className="text-sm font-bold text-brand">{euro(d.montantTTC)}</p>
                  )}
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUT_STYLE[d.statut] ?? "bg-slate-100 text-slate-600"}`}>
                    {d.statut}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {d.pdfUrl ? (
                  <a
                    href={d.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-brand px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand-light"
                  >
                    👁️ Voir
                  </a>
                ) : (
                  <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">PDF indisponible</span>
                )}
                <button
                  onClick={() => renvoyer(d, "email")}
                  disabled={busyKey === d.key + "email"}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {busyKey === d.key + "email" ? "…" : "✉️ Renvoyer mail"}
                </button>
                <button
                  onClick={() => renvoyer(d, "sms")}
                  disabled={busyKey === d.key + "sms"}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
                >
                  {busyKey === d.key + "sms" ? "…" : "💬 Renvoyer SMS"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
