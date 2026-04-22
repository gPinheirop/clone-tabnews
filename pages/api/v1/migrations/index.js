import { resolve } from "node:path";
import controller from "infra/controller/controller";
import database from "infra/database";
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

const defaultMigrationObject = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(_, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const prendingMigrations = await migrationRunner({
      ...defaultMigrationObject,
      dbClient,
    });
    return response.status(200).json(prendingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(_, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const finishedMigrations = await migrationRunner({
      ...defaultMigrationObject,
      dbClient,
      dryRun: false,
    });
    if (finishedMigrations.length > 0) {
      return response.status(201).json(finishedMigrations);
    }
    return response.status(200).json(finishedMigrations);
  } finally {
    await dbClient.end();
  }
}
