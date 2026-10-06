import { addComment } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { body?: string };
    const comment = addComment(id, body.body ?? "");
    return Response.json(comment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add that comment.";
    return Response.json({ error: message }, { status: 400 });
  }
}
