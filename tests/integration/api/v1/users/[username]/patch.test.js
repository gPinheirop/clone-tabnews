import password from "models/password";
import user from "models/users";
import { version as uuidVersion } from "uuid";
import orchestrator from "../../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexisting 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/usuarioInexisetnte",
        { method: "PATCH" },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado",
        action: "Verifique o apelido e tente novamente",
        status_code: 404,
      });
    });
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Apelido informado já existe",
        action: "Utilize outro apelido",
        status_code: 400,
      });
    });
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email@duplicado1.com",
      });

      const newUser = await orchestrator.createUser({
        email: "email@duplicado2.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email@duplicado1.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Email informado já existe",
        action: "Utilize outro email",
        status_code: 400,
      });
    });
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "uniqueUser",
        email: "usuario@unico.com",
        password: "senhaTeste",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser1",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser1",
        email: "usuario@unico.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique 'email'", async () => {
      await orchestrator.createUser({
        username: "uniqueUserEmail",
        email: "email@unico.com",
        password: "senhaTeste",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUserEmail",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email@unico1.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUserEmail",
        email: "email@unico1.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With new 'password'", async () => {
      await orchestrator.createUser({
        username: "uniqueUserPassword",
        email: "senha@unica.com",
        password: "senhaUnica",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUserPassword",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "senhaUnica1",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUserPassword",
        email: "senha@unica.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      const userInDatabase =
        await user.findUserByUsername("uniqueUserPassword");

      const correctPasswordMatch = await password.compare(
        "senhaUnica1",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senhaUnica",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
