import { openDB, type DBSchema } from "idb";
import type { Sighting } from "@/lib/types";

interface FieldnoteDb extends DBSchema {
  pending: { key: string; value: Sighting };
}

const DB_NAME = "fieldnote";

async function db() {
  return openDB<FieldnoteDb>(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("pending")) {
        database.createObjectStore("pending", { keyPath: "id" });
      }
    },
  });
}

export async function queueSighting(sighting: Sighting): Promise<void> {
  const database = await db();
  await database.put("pending", { ...sighting, pending: true });
}

export async function pendingSightings(): Promise<Sighting[]> {
  const database = await db();
  return database.getAll("pending");
}

export async function removePending(id: string): Promise<void> {
  const database = await db();
  await database.delete("pending", id);
}
