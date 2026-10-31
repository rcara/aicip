import { pathToFileURL } from "node:url";

import { closeDb } from "../src/db/client";
import { grantAdmin } from "../src/db/repository";

async function main() {
  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:grant -- learner@example.com");
    process.exit(1);
  }
  const result = await grantAdmin(email);
  if (result === "missing") {
    console.error("Aucun compte actif pour cette adresse. Le rôle n'a pas été créé.");
    process.exit(1);
  }
  console.log("Rôle admin attribué à un compte existant.");
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
