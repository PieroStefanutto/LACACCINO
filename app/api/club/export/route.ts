import { clubRpc, clubIdentity } from "@/lib/club/server";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await clubIdentity()))
    return new Response("Bitte anmelden.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  try {
    const data = await clubRpc("club_export");
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="lacaccino-meine-daten.json"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Datenexport gerade nicht verfügbar.", { status: 503 });
  }
}
