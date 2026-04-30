import { NotFoundError, UnauthorizedError } from "infra/errors";
import password from "./password";
import user from "./users";

async function authenticateUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação inválidos",
        action: "Verifique os valores e tente novamente",
      });
    }
    throw error;
  }

  async function findUserByEmail(email) {
    let storedUser;
    try {
      storedUser = await user.findUserByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere",
          action: "Verifique se este dado está tente novamente",
        });
      }
      throw error;
    }
    return storedUser;
  }

  async function validatePassword(providedPassword, userPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      userPassword,
    );

    if (!correctPasswordMatch)
      throw new UnauthorizedError({
        message: "Senha não confere",
        action: "Verifique se este dado está tente novamente",
      });
  }
}

const authentication = {
  authenticateUser,
};

export default authentication;
