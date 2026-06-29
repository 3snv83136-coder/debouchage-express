"use client";

import { useState } from "react";

export function EnvoiPanel({
  id, clientTel, clientEmail, rapportUrl, factureUrl,
}: {
  id: string;
  clientTel: string;
  clientEmail: string | null;
  rapportUrl: string | null;
  factureUrl: string | null;
}) {
  const [email, setEmail] = useState(clientEmail ?? "");
  const [tel, setTel] = useState(clientTel);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"" | "email" | "sms">("");

  const pret = !!rapportUrl && !!factureUrl;

  async function envoyer(canal: "email" | "sms") {
    setBusy(canal); setMsg(null);
    try {
      const res = await fetch(`/api/envoi/${canal}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interventionId: id, to: canal === "email" ? email : tel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi");
      setMsg({ ok: true, text: canal === "email" ? "Email envoyé ✓" : "SMS envoyé ✓" });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500">Envoyer au client</h2>

      {!pret && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          Le rapport et la facture doivent être générés avant l'envoi.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@client.fr"
            className="flex-1 rounded-lg border border-slate-300 p-2.5 text-sm" />
          <button onClick={() => envoyer("email")} disabled={!pret || !email || busy !== ""}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy === "email" ? "…" : "✉️ Mail"}
          </button>
        </div>
        <div className="flex gap-2">
          <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78"
            className="flex-1 rounded-lg border border-slate-300 p-2.5 text-sm" />
          <button onClick={() => envoyer("sms")} disabled={!pret || !tel || busy !== ""}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy === "sms" ? "…" : "💬 SMS"}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`rounded-lg p-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
