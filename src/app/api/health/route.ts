import { APP_NAME } from "@/config/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Kept off the database module so a keep-warm ping does not open SQLite. */
function serverModelsFromEnv(): boolean {
  const flag = process.env.ENABLE_SERVER_MODELS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function GET() {
  return Response.json({
    ok: true,
    name: APP_NAME,
    demo: process.env.DEMO_MODE !== "false",
    serverModels: serverModelsFromEnv(),
  });
}
