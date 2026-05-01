import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

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

async function findOneValidByToken(token) {
  const results = await database.query({
    text: `SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()`,
    values: [token],
  });
  if (results.rowCount === 0) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa.",
      action: "Faça login novamente",
    });
  }
  return results.rows[0];
}

async function renew(id) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISSECONDS);

  const results = await database.query({
    text: "UPDATE sessions SET expires_at = $2, updated_at = NOW() WHERE id = $1 RETURNING *;",
    values: [id, expiresAt],
  });

  return results.rows[0];
}

async function expireById(id) {
  const results = await database.query({
    text: "UPDATE sessions set expires_at = expires_at - interval '1 year', updated_at = NOW() WHERE id = $1 RETURNING *;",
    values: [id],
  });

  return results.rows[0];
}

const session = {
  create,
  renew,
  expireById,
  findOneValidByToken,
  EXPIRATION_IN_MILLISSECONDS,
};

export default session;
