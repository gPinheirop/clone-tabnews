import { resolve } from "node:path";
import database from "infra/database";
import migrationRunner from "node-pg-migrate";

const defaultMigrationObject = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const prendingMigrations = await migrationRunner({
      ...defaultMigrationObject,
      dbClient,
    });
    return prendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const finishedMigrations = await migrationRunner({
      ...defaultMigrationObject,
      dbClient,
      dryRun: false,
    });

    return finishedMigrations;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
