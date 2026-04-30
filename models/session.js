import crypto from "node:crypto";
import database from "infra/database";

// 30 days
const EXPIRATION_IN_MILLISSECONDS = 60 * 60 * 24 * 30 * 1000;

async function create(id) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISSECONDS);

  const newSession = await runInsertQuery(token, id, expiresAt);
  return newSession;

  async function runInsertQuery(token, id, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [token, id, expiresAt],
    });

    return results.rows[0];
  }
}

const session = {
  create,
  EXPIRATION_IN_MILLISSECONDS,
};

export default session;
