import controller from "infra/controller";
import database from "infra/database";
import authorization from "models/authorization";
import { createRouter } from "next-connect";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const updatedAt = new Date().toISOString();

  const dbVersion = await database.query("SHOW server_version;");

  const dbMaxConnections = await database.query("SHOW max_connections");

  const databaseName = process.env.POSTGRES_DB;

  const dbOpenConnections = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbVersion.rows[0].server_version,
        opened_connections: dbOpenConnections.rows[0].count,
        max_connections: Number(dbMaxConnections.rows[0].max_connections),
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureOutputValues);
}
