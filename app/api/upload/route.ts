import { NextResponse } from "next/server";
import { uploadPublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const interventionId = (form.get("interventionId") as string) || "tmp";
  const phase = (form.get("phase") as string) || "photo";
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `interventions/${interventionId}/${phase}-${Date.now()}.${ext}`;

  try {
    const url = await uploadPublic(path, buf, file.type || "image/jpeg");
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
