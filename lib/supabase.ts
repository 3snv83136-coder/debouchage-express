import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client serveur (service role) — upload photos + PDF dans le bucket public.
// Instanciation paresseuse : évite de planter au build si les variables ne sont pas définies.
let _supabaseAdmin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Variables Supabase manquantes (URL / SERVICE_ROLE_KEY)");
    _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabaseAdmin;
}

const BUCKET = process.env.SUPABASE_BUCKET || "debex";

/** Upload un buffer/blob et renvoie l'URL publique. */
export async function uploadPublic(
  path: string,
  data: Buffer | Uint8Array | ArrayBuffer,
  contentType: string
): Promise<string> {
  const client = supabaseAdmin();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, data as any, { contentType, upsert: true });
  if (error) throw new Error(`Supabase upload: ${error.message}`);
  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}
