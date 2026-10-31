import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { requireDatabaseUrl } from "@/lib/config";

import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let database: Database | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb(): Database {
  if (database && client) return database;
  client = postgres(requireDatabaseUrl(), { max: 10 });
  database = drizzle(client, { schema });
  return database;
}

export async function closeDb(): Promise<void> {
  if (client) await client.end();
  client = null;
  database = null;
}
