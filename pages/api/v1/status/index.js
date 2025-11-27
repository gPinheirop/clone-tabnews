import database from "infra/database";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const dbVersion = await database.query("SHOW server_version;");

  const dbMaxConnections = await database.query("SHOW max_connections");

  const databaseName = process.env.POSTGRES_DB;

  const dbOpenConnections = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbVersion.rows[0].server_version,
        opened_connections: dbOpenConnections.rows[0].count,
        max_connections: Number(dbMaxConnections.rows[0].max_connections),
      },
    },
  });
}

export default status;
