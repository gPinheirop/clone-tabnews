import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

async function create(newUserInputValues) {
  await validadeUniqueEmail(newUserInputValues.email);
  await validadeUniqueUsername(newUserInputValues.username);
  await hashPasswordInObject(newUserInputValues);

  const newUser = await runInsertQuery(newUserInputValues);
  return newUser;

  async function hashPasswordInObject(newUserInputValues) {
    const hasedPassword = await password.hash(newUserInputValues.password);
    newUserInputValues.password = hasedPassword;
  }

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

async function findUserByUsername(username) {
  const user = await runSelectQuery(username);

  return user;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: "SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado",
        action: "Verifique o apelido e tente novamente",
      });
    }

    return result.rows[0];
  }
}

const user = {
  create,
  findUserByUsername,
};

export default user;
