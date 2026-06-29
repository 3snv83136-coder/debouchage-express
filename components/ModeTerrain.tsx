"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tarif = { type: string; label: string; prixMin: number; prixMax: number };
type Travaux = { libelle: string; quantite: number; prixUnitaire: number };

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function ModeTerrain({ tarifs }: { tarifs: Tarif[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Étape 1 — client
  const [form, setForm] = useState({
    client: "", clientTel: "", clientEmail: "", adresse: "", ville: "", codePostal: "",
    typeService: tarifs[0]?.label ?? "Débouchage", notes: "",
  });

  // Étape 2 — photos avant + travaux
  const [photosAvant, setPhotosAvant] = useState<string[]>([]);
  const [travaux, setTravaux] = useState<Travaux[]>([]);

  // Étape 3 — photos après
  const [photosApres, setPhotosApres] = useState<string[]>([]);

  const totalTravaux = travaux.reduce((s, t) => s + t.prixUnitaire * t.quantite, 0);

  async function upload(file: File, phase: "avant" | "apres") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("interventionId", id ?? "tmp");
    fd.append("phase", phase);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload échoué");
    const { url } = await res.json();
    return url as string;
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>, phase: "avant" | "apres") {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setErr(null);
    try {
      const urls = await Promise.all(files.map((f) => upload(f, phase)));
      if (phase === "avant") setPhotosAvant((p) => [...p, ...urls]);
      else setPhotosApres((p) => [...p, ...urls]);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function createIntervention() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Création échouée");
      }
      const data = await res.json();
      setId(data.id);
      setStep(2);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function saveAvantEtTravaux() {
    setBusy(true); setErr(null);
    try {
      await fetch(`/api/interventions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photosAvant, travaux }),
      });
      setStep(3);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function finaliser() {
    setBusy(true); setErr(null);
    try {
      await fetch(`/api/interventions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photosApres, statut: "TERMINEE" }),
      });
      // Génère rapport puis facture
      await fetch(`/api/rapport/${id}`, { method: "POST" });
      await fetch(`/api/facture/${id}`, { method: "POST" });
      router.push(`/intervention/${id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {step === 1 && (
        <Card title="1 · Client & prestation">
          <Field label="Nom du client" value={form.client} onChange={(v) => setForm({ ...form, client: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.clientTel} onChange={(v) => setForm({ ...form, clientTel: v })} type="tel" />
            <Field label="Email (option)" value={form.clientEmail} onChange={(v) => setForm({ ...form, clientEmail: v })} type="email" />
          </div>
          <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code postal" value={form.codePostal} onChange={(v) => setForm({ ...form, codePostal: v })} />
            <Field label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Type de prestation</span>
            <select
              className="w-full rounded-lg border border-slate-300 p-2.5"
              value={form.typeService}
              onChange={(e) => setForm({ ...form, typeService: e.target.value })}
            >
              {tarifs.map((t) => <option key={t.type} value={t.label}>{t.label}</option>)}
            </select>
          </label>
          <button onClick={createIntervention} disabled={busy || !form.client || !form.clientTel} className="btn-primary">
            {busy ? "…" : "Continuer →"}
          </button>
        </Card>
      )}

      {step === 2 && (
        <Card title="2 · Photo avant + travaux supplémentaires">
          <PhotoZone label="Photos AVANT intervention" photos={photosAvant} onPick={(e) => onFiles(e, "avant")} busy={busy} />

          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-slate-600">Travaux supplémentaires constatés</p>
            <TravauxEditor tarifs={tarifs} travaux={travaux} setTravaux={setTravaux} />
            {travaux.length > 0 && (
              <p className="mt-2 text-right text-sm font-semibold text-brand">Total travaux : {euro(totalTravaux)}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-ghost">← Retour</button>
            <button onClick={saveAvantEtTravaux} disabled={busy} className="btn-primary flex-1">
              {busy ? "…" : "Continuer →"}
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="3 · Photo après">
          <PhotoZone label="Photos APRÈS intervention" photos={photosApres} onPick={(e) => onFiles(e, "apres")} busy={busy} />
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-ghost">← Retour</button>
            <button onClick={() => setStep(4)} disabled={busy} className="btn-primary flex-1">Récapitulatif →</button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="4 · Validation">
          <ul className="space-y-1 text-sm text-slate-600">
            <li><b>Client :</b> {form.client} — {form.clientTel}</li>
            <li><b>Adresse :</b> {form.adresse}, {form.codePostal} {form.ville}</li>
            <li><b>Prestation :</b> {form.typeService}</li>
            <li><b>Photos avant :</b> {photosAvant.length} · <b>après :</b> {photosApres.length}</li>
            <li><b>Travaux supp. :</b> {travaux.length} ({euro(totalTravaux)})</li>
          </ul>
          <p className="rounded-lg bg-brand-light p-3 text-sm text-brand-dark">
            La validation génère le <b>rapport</b> et la <b>facture</b>, puis ouvre l'écran d'envoi (mail + SMS).
          </p>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="btn-ghost">← Retour</button>
            <button onClick={finaliser} disabled={busy} className="btn-primary flex-1">
              {busy ? "Génération…" : "✓ Générer rapport + facture"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------- sous-composants ---------- */

function Stepper({ step }: { step: number }) {
  const labels = ["Client", "Avant", "Après", "Valider"];
  return (
    <div className="flex items-center justify-between">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n <= step;
        return (
          <div key={l} className="flex flex-1 items-center">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-brand text-white" : "bg-slate-200 text-slate-500"}`}>{n}</div>
            <span className={`ml-1 text-xs ${active ? "text-brand font-medium" : "text-slate-400"}`}>{l}</span>
            {n < 4 && <div className={`mx-1 h-0.5 flex-1 ${n < step ? "bg-brand" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5" />
    </label>
  );
}

function PhotoZone({ label, photos, onPick, busy }: { label: string; photos: string[]; onPick: (e: React.ChangeEvent<HTMLInputElement>) => void; busy: boolean }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-600">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
          <span className="text-2xl">📷</span>
          <span className="text-[10px]">{busy ? "…" : "Ajouter"}</span>
          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onPick} />
        </label>
      </div>
    </div>
  );
}

function TravauxEditor({ tarifs, travaux, setTravaux }: { tarifs: Tarif[]; travaux: Travaux[]; setTravaux: (t: Travaux[]) => void }) {
  const [libelle, setLibelle] = useState(tarifs[0]?.label ?? "");
  const [prix, setPrix] = useState(tarifs[0]?.prixMin ?? 0);
  const [qte, setQte] = useState(1);

  function add() {
    if (!libelle || prix <= 0) return;
    setTravaux([...travaux, { libelle, quantite: qte, prixUnitaire: prix }]);
  }

  return (
    <div className="space-y-2">
      {travaux.map((t, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
          <span>{t.libelle} ×{t.quantite}</span>
          <span className="flex items-center gap-2">
            <b>{euro(t.prixUnitaire * t.quantite)}</b>
            <button onClick={() => setTravaux(travaux.filter((_, j) => j !== i))} className="text-red-500">✕</button>
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
        <label className="block">
          <span className="text-[11px] text-slate-500">Désignation</span>
          <select
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            value={libelle}
            onChange={(e) => {
              const t = tarifs.find((x) => x.label === e.target.value);
              setLibelle(e.target.value);
              if (t) setPrix(t.prixMin);
            }}
          >
            {tarifs.map((t) => <option key={t.type} value={t.label}>{t.label}</option>)}
            <option value="Autre prestation">Autre prestation</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-slate-500">PU €</span>
          <input type="number" value={prix} onChange={(e) => setPrix(Number(e.target.value))} className="w-20 rounded-lg border border-slate-300 p-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-[11px] text-slate-500">Qté</span>
          <input type="number" value={qte} min={1} onChange={(e) => setQte(Number(e.target.value))} className="w-14 rounded-lg border border-slate-300 p-2 text-sm" />
        </label>
        <button onClick={add} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">+</button>
      </div>
    </div>
  );
}
