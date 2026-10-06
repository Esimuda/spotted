import { listProfiles, listSightings, serverModelsEnabled } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    viewerId: "you",
    demo: true,
    serverModels: serverModelsEnabled(),
    profiles: listProfiles(),
    sightings: listSightings(),
  });
}
