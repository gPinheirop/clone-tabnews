import { MethodNotAllowedError } from "infra/errors";
import orchestrator from "../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retriving current system status", async () => {
      const response = await fetch(`${webserver.originAPI}/status`, {
        method: "POST",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual(new MethodNotAllowedError().toJSON());
    });
  });
});
