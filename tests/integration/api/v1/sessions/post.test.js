import * as cookie from "cookie";
import session from "models/session";
import { version as uuidVersion } from "uuid";
import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With wrong 'email', but correct 'password'", async () => {
      await orchestrator.createUser({
        password: "senhaCorreta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email@errado.com",
          password: "senhaCorreta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos",
        action: "Verifique os valores e tente novamente",
        status_code: 401,
      });
    });
    test("With correct 'email', but worng 'password'", async () => {
      await orchestrator.createUser({
        email: "email@correto.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email@correto.com",
          password: "senhaErrada",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos",
        action: "Verifique os valores e tente novamente",
        status_code: 401,
      });
    });
    test("With wrong 'email' and worng 'password'", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email@errada.com",
          password: "senhaErrada",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos",
        action: "Verifique os valores e tente novamente",
        status_code: 401,
      });
    });
    test("With correct 'email' and correct 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "login@correto.com",
        password: "loginCorreto",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "login@correto.com",
          password: "loginCorreto",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
        token: responseBody.token,
        updated_at: responseBody.updated_at,
        user_id: createdUser.id,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISSECONDS);

      const parsetSetCookie = cookie.parseSetCookie(
        response.headers.getSetCookie()[0],
      );
      expect(parsetSetCookie).toEqual({
        name: "session_id",
        value: parsetSetCookie.value,
        maxAge: session.EXPIRATION_IN_MILLISSECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
