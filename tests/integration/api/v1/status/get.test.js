import webserver from "infra/webserver";
import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retriving current system status", async () => {
      const response = await fetch(`${webserver.originAPI}/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.database.opened_connections).toBe(1);
      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });
  describe("Default user", () => {
    test("Retriving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(`${webserver.originAPI}/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.database.opened_connections).toBe(1);
      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });
  describe("Privileged user", () => {
    test("Retriving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserById(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser, [
        "read:status",
        "read:status:all",
      ]);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(`${webserver.originAPI}/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.database.version).toBe("16.0");
      expect(responseBody.dependencies.database.opened_connections).toBe(1);
      expect(responseBody.dependencies.database.max_connections).toBe(100);
    });
  });
});
