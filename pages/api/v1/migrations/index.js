import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

import database from "infra/database";

export default async function Migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationObject = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    const prendingMigrations = await migrationRunner(defaultMigrationObject);
    await dbClient.end();

    return response.status(200).json(prendingMigrations);
  }

  if (request.method === "POST") {
    const finishedMigrations = await migrationRunner({
      ...defaultMigrationObject,
      dryRun: false,
    });
    await dbClient.end();

    if (finishedMigrations.length > 0) {
      return response.status(201).json(finishedMigrations);
    }
    return response.status(200).json(finishedMigrations);
  }

  await dbClient.end();
  return response.status(405).end();
}
