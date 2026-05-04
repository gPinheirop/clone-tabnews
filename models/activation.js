import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

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

async function findByUserId(id) {
  const results = await database.query({
    text: "SELECT * FROM user_activation_tokens WHERE user_id = $1 LIMIT 1",
    values: [id],
  });

  return results.rows[0];
}

const activation = {
  sendEmailToUser,
  create,
  findByUserId,
};
export default activation;
