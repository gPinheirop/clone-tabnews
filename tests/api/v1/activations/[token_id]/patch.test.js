import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/users";
import orchestrator from "tests/integration/api/v1/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("with nonexisting token", async () => {
      const response = await fetch(
        `${webserver.originAPI}/activations/ec2551b3-eab9-4314-ad17-0fca42522716`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Token não encontrado",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });
    test("with expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useFakeTimers();

      const response = await fetch(
        `${webserver.originAPI}/activations/${expiredActivationToken.id}`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Token não encontrado",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });
    test("with already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.originAPI}/activations/${activationToken.id}`,
        { method: "PATCH" },
      );
      expect(response.status).toBe(200);

      const response2 = await fetch(
        `${webserver.originAPI}/activations/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(response2.status).toBe(404);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "Token não encontrado",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });
    test("with valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.originAPI}/activations/${activationToken.id}`,
        { method: "PATCH" },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: activationToken.id,
        used_at: responseBody.used_at,
        user_id: activationToken.user_id,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const activatedUser = await user.findUserById(responseBody.user_id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });
    test("with valid token with already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserById(createdUser.id);
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.originAPI}/activations/${activationToken.id}`,
        { method: "PATCH" },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação",
        action: "Entre em contato com o suporte",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("with valid token, but already logged user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUserById(user1.id);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `${webserver.originAPI}/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para acessar esse recurso",
        action:
          "Verifique se seu usuário possui a feature: read:activation_token",
        status_code: 403,
      });
    });
  });
});
