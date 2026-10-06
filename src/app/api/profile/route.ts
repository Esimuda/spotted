import { updateProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; homeBase?: string; bio?: string };
    return Response.json(updateProfile(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update your profile.";
    return Response.json({ error: message }, { status: 400 });
  }
}
