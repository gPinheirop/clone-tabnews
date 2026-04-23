import { resolve } from "node:path";
import database from "infra/database";
import migrationRunner from "node-pg-migrate";
import { ServiceError } from "infra/errors";

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
  } catch (error) {
    const serviceErrorObect = new ServiceError({
      message: "Erro na conexão com Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObect;
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
  } catch (error) {
    const serviceErrorObect = new ServiceError({
      message: "Erro na conexão com Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObect;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
