import { version as uuidVersion } from "uuid";
import orchestrator from "../../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match 'username'", async () => {
      await orchestrator.createUser({
        username: "testeExato",
        email: "usuario@email.com",
        password: "senhaTeste",
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/testeExato",
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "testeExato",
        email: "usuario@email.com",
        password: response2Body.password,
        features: [],
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
    test("With 'username' case mismatch", async () => {
      await orchestrator.createUser({
        username: "testeCaseDiferente",
        email: "usuario2@email.com",
        password: "senha2Teste",
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/testecasediferente",
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "testeCaseDiferente",
        email: "usuario2@email.com",
        password: response2Body.password,
        features: [],
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
    test("With nonexisting username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/usuarioInexisetnte",
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
  });
});
