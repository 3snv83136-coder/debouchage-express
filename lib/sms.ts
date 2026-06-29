// Adaptateur SMS — provider-agnostic. Par défaut Brevo (France), swappable Twilio.
// En dev sans clé : mode "console" (log uniquement).

type SmsResult = { ok: boolean; id?: string; error?: string };

/** Normalise un numéro FR vers le format E.164 (+33...). */
export function toE164FR(raw: string): string {
  const d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("0")) return "+33" + d.slice(1);
  if (d.startsWith("33")) return "+" + d;
  return d;
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "console";
  const num = toE164FR(to);

  if (provider === "console") {
    console.log(`[SMS:console] → ${num}\n${message}`);
    return { ok: true, id: "console" };
  }

  if (provider === "brevo") {
    try {
      const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY || "",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: process.env.SMS_SENDER || "DebExpress",
          recipient: num.replace("+", ""),
          content: message,
          type: "transactional",
        }),
      });
      if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${await res.text()}` };
      const json = await res.json();
      return { ok: true, id: String(json.messageId ?? "") };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  if (provider === "twilio") {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      const token = process.env.TWILIO_AUTH_TOKEN!;
      const body = new URLSearchParams({
        To: num,
        From: process.env.TWILIO_FROM || "",
        Body: message,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) return { ok: false, error: `Twilio ${res.status}: ${await res.text()}` };
      const json = await res.json();
      return { ok: true, id: json.sid };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  return { ok: false, error: `Provider SMS inconnu: ${provider}` };
}
