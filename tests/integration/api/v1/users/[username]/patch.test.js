import password from "models/password";
import user from "models/users";
import { version as uuidVersion } from "uuid";
import orchestrator from "../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "uniqueUser",
        email: "usuario@unico.com",
        password: "senhaTeste",
      });

      const response = await fetch(`${webserver.originAPI}/users/uniqueUser`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueUser2",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para acessar esse recurso",
        action: "Verifique se seu usuário possui a feature: update:user",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With nonexisting 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await await orchestrator.createSession(
        activatedUser.id,
      );
      const response = await fetch(
        `${webserver.originAPI}/users/usuarioInexisetnte`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
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

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });

      const activatedUser2 = await orchestrator.activateUserById(
        createdUser2.id,
      );
      const sessionObject2 = await await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(`${webserver.originAPI}/users/user2`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
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
    test("With user2 targeting user1", async () => {
      await orchestrator.createUser({
        username: "user42",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user43",
      });

      const activatedUser2 = await orchestrator.activateUserById(
        createdUser2.id,
      );
      const sessionObject2 = await await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(`${webserver.originAPI}/users/user42`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user44",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Verifique suas permissões antes de tentar novamente",
        message: "Você não possui a permissão para atualizar outro usuário",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email@duplicado1.com",
      });

      const newUser = await orchestrator.createUser({
        email: "email@duplicado2.com",
      });

      const newActivatedUser = await orchestrator.activateUserById(newUser.id);
      const newSessionObject = await await orchestrator.createSession(
        newActivatedUser.id,
      );

      const response = await fetch(
        `${webserver.originAPI}/users/${newUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${newSessionObject.token}`,
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
      const createdUser = await orchestrator.createUser({
        username: "uniqueUser1",
        email: "usuario@unico1.com",
        password: "senhaTeste",
      });

      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(`${webserver.originAPI}/users/uniqueUser1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          username: "uniqueUser2",
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: "usuario@unico1.com",
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "uniqueUserEmail",
        email: "email@unico.com",
        password: "senhaTeste",
      });
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(
        `${webserver.originAPI}/users/uniqueUserEmail`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "uniqueUserPassword",
        email: "senha@unica.com",
        password: "senhaUnica",
      });
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(
        `${webserver.originAPI}/users/uniqueUserPassword`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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
  describe("Privileged user", () => {
    test("with 'update:user:others' targeting default user 'userY'", async () => {
      const privilegedUser = await orchestrator.createUser({
        username: "userX",
      });
      const activatedPrivilegedUser = await orchestrator.activateUserById(
        privilegedUser.id,
      );
      const privilegeSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      await orchestrator.createUser({
        username: "userY",
      });

      const response = await fetch(`${webserver.originAPI}/users/userY`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegeSession.token}`,
        },
        body: JSON.stringify({
          username: "userZ",
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "userZ",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
