import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

import database from "infra/database";

export default async function Migrations(request, response) {
  const allowedMethods = ["POST", "GET"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).end({
      error: `Method ${response.method} not allowed`,
    });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();

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

      return response.status(200).json(prendingMigrations);
    }

    if (request.method === "POST") {
      const finishedMigrations = await migrationRunner({
        ...defaultMigrationObject,
        dryRun: false,
      });

      if (finishedMigrations.length > 0) {
        return response.status(201).json(finishedMigrations);
      }

      return response.status(200).json(finishedMigrations);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.end();
  }
}
