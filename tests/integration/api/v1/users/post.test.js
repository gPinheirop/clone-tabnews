import password from "models/password";
import user from "models/users";
import { version as uuidVersion } from "uuid";
import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "nomeTeste",
          email: "email@email.com",
          password: "senhaTeste",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "nomeTeste",
        email: "email@email.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findUserByUsername("nomeTeste");

      const correctPasswordMatch = await password.compare(
        "senhaTeste",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senhaErrada",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailDuplicado1",
          email: "email@duplicado.com",
          password: "senhaTeste",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailDuplicado2",
          email: "Email@duplicado.com",
          password: "senhaTeste",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "Email informado já existe",
        action: "Utilize outro email",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      const response3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "nomeDuplicado",
          email: "nome@duplicado1.com",
          password: "senhaTeste",
        }),
      });

      expect(response3.status).toBe(201);

      const response4 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "nomeDuplicado",
          email: "nome@duplicado2.com",
          password: "senhaTeste",
        }),
      });

      expect(response4.status).toBe(400);

      const response4Body = await response4.json();
      expect(response4Body).toEqual({
        name: "ValidationError",
        message: "Apelido informado já existe",
        action: "Utilize outro apelido",
        status_code: 400,
      });
    });
  });
  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUserById(user1.id);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "testeLogado",
          email: "teste@logado.com",
          password: "senhaLogado",
        }),
      });

      expect(user2Response.status).toBe(403);

      const user2ResponseBody = await user2Response.json();
      console.log(user2ResponseBody);

      expect(user2ResponseBody).toEqual({
        action: "Verifique se seu usuário possui a feature: create:user",
        message: "Você não possui permissão para acessar esse recurso",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
