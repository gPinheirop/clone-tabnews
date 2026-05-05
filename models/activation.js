import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";
import user from "./users";
import authorization from "./authorization";
import { ForbiddenError, NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; //15 minutes

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "<contato@gabrpinheiro.com.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `${user.username}, clique no link abaixo para ativar o seu cadastro:
${webserver.origin}/cadastro/ativar/${activationToken.id}
Atenciosamente,
Gabriel Pinheiro Pedreira`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const results = await database.query({
    text: `INSERT INTO user_activation_tokens (user_id, expires_at) VALUES ($1, $2) RETURNING *`,
    values: [userId, expiresAt],
  });
  return results.rows[0];
}

async function findValidById(id) {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      user_activation_tokens
    WHERE
      id = $1
    AND expires_at > NOW()
    AND used_at IS NULL
    LIMIT
      1
    ;`,
    values: [id],
  });

  if (results.rows.length === 0) {
    throw new NotFoundError({
      message: "Token não encontrado",
      action: "Faça um novo cadastro",
    });
  }

  return results.rows[0];
}

async function maskTokenAsUsed(id) {
  const results = await database.query({
    text: `
    UPDATE
      user_activation_tokens
    SET
      used_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    WHERE
      id = $1
    RETURNING
      *;`,
    values: [id],
  });

  return results.rows[0];
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findUserById(userId);
  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação",
      action: "Entre em contato com o suporte",
    });
  }

  const activatedUser = user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);

  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findValidById,
  maskTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};
export default activation;
