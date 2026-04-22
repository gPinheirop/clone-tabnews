import { MethodNotAllowedError } from "infra/errors";
import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retriving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual(new MethodNotAllowedError().toJSON());
    });
  });
});
