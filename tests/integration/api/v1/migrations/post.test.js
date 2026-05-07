import webserver from "infra/webserver";
import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response = await fetch(`${webserver.originAPI}/migrations`, {
        method: "POST",
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para acessar esse recurso",
        action: `Verifique se seu usuário possui a feature: create:migration`,
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await orchestrator.createSessionById(
        activatedUser.id,
      );

      const response = await fetch(`${webserver.originAPI}/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para acessar esse recurso",
        action: `Verifique se seu usuário possui a feature: create:migration`,
        status_code: 403,
      });
    });
  });
  describe("Privileged user", () => {
    test("Running pending migrations with create:migration", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser, ["create:migration"]);
      const sessionObject = await orchestrator.createSessionById(
        activatedUser.id,
      );

      const response = await fetch(`${webserver.originAPI}/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
