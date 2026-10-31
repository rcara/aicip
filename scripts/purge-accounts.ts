import { pathToFileURL } from "node:url";

import { closeDb } from "../src/db/client";
import { purgeExpiredDeletions } from "../src/db/repository";

async function main() {
  const result = await purgeExpiredDeletions();
  console.log(
    `Rétention appliquée : ${result.journals} journaux et ${result.users} comptes fermés retirés.`,
  );
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    })
    .finally(async () => {
      await closeDb();
    });
}
