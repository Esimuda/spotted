import type { Metadata } from "next";
import { IdentifyFlow } from "@/components/identify-flow";

export const metadata: Metadata = { title: "Field" };

export default function FieldPage() {
  return <IdentifyFlow />;
}
