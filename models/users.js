import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(newUserInputValues) {
  await validadeUniqueEmail(newUserInputValues.email);
  await validadeUniqueUsername(newUserInputValues.username);

  const newUser = await runInsertQuery(newUserInputValues);
  return newUser;

  async function validadeUniqueUsername(username) {
    const result = await database.query({
      text: "SELECT username FROM users WHERE LOWER(username) = LOWER($1)",
      values: [username],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "Apelido informado já existe",
        action: "Utilize outro apelido",
      });
    }
  }
  async function validadeUniqueEmail(email) {
    const result = await database.query({
      text: "SELECT email FROM users WHERE LOWER(email) = LOWER($1)",
      values: [email],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "Email informado já existe",
        action: "Utilize outro email",
      });
    }
  }

  async function runInsertQuery({ username, email, password }) {
    const result = await database.query({
      text: "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      values: [username, email, password],
    });

    return result.rows[0];
  }
}

const user = {
  create,
};

export default user;
