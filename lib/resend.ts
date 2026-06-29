import { Resend } from "resend";

// Instanciation paresseuse : évite de planter au build si la clé n'est pas définie.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY manquante");
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const from = process.env.EMAIL_FROM || "Débouchage Express <onboarding@resend.dev>";
  return getResend().emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}
