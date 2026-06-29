"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentsActions({
  interventionId,
  rapportUrl,
  factureUrl,
  factureNumero,
  devisUrl,
  devisNumero,
}: {
  interventionId: string;
  rapportUrl: string | null;
  factureUrl: string | null;
  factureNumero: string | null;
  devisUrl: string | null;
  devisNumero: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "devis" | "facture">("");
  const [err, setErr] = useState<string | null>(null);

  async function generer(type: "devis" | "facture") {
    setBusy(type);
    setErr(null);
    try {
      const res = await fetch(`/api/${type}/${interventionId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Génération impossible");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-500">Documents</h2>

      {err && <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{err}</p>}

      <div className="flex flex-wrap gap-2">
        {rapportUrl ? (
          <a href={rapportUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand">
            📄 Rapport
          </a>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Rapport non généré</span>
        )}

        {devisUrl ? (
          <a href={devisUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-accent px-3 py-2 text-sm font-medium text-accent-dark">
            📝 Devis{devisNumero ? ` ${devisNumero}` : ""}
          </a>
        ) : (
          <button
            onClick={() => generer("devis")}
            disabled={busy !== ""}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
          >
            {busy === "devis" ? "Génération…" : "+ Générer un devis"}
          </button>
        )}

        {factureUrl ? (
          <a href={factureUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand">
            🧾 Facture{factureNumero ? ` ${factureNumero}` : ""}
          </a>
        ) : (
          <button
            onClick={() => generer("facture")}
            disabled={busy !== ""}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {busy === "facture" ? "Génération…" : "+ Générer la facture"}
          </button>
        )}
      </div>
    </div>
  );
}
