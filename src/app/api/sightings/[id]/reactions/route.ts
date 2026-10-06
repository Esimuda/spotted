import { toggleReaction } from "@/lib/db";
import type { ReactionKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { kind?: ReactionKind };
    if (body.kind !== "wonder" && body.kind !== "seen" && body.kind !== "protect") {
      return Response.json({ error: "Unknown reaction." }, { status: 400 });
    }
    return Response.json(toggleReaction(id, body.kind));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that reaction.";
    return Response.json({ error: message }, { status: 400 });
  }
}
