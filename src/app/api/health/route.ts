import { APP_NAME } from "@/config/brand";
import { serverModelsEnabled } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    name: APP_NAME,
    demo: true,
    serverModels: serverModelsEnabled(),
  });
}
