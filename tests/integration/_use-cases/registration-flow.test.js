import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/users";
import orchestrator from "../api/v1/orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let activationToken;
  let createSessionsResponseBody;
  test("Create user account", async () => {
    const createUserResponse = await fetch(`${webserver.originAPI}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testeRegistro",
        email: "registro@email.com",
        password: "registrar",
      }),
    });
    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "testeRegistro",
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@gabrpinheiro.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registro@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro!");
    expect(lastEmail.text).toContain("testeRegistro");

    activationToken = orchestrator.extractUUID(lastEmail.text);
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationToken}`,
    );

    const activationTokenObject =
      await activation.findValidById(activationToken);
    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `${webserver.originAPI}/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );
    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findUserByUsername("testeRegistro");
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionsResponse = await fetch(
      `${webserver.originAPI}/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registro@email.com",
          password: "registrar",
        }),
      },
    );

    expect(createSessionsResponse.status).toBe(201);

    createSessionsResponseBody = await createSessionsResponse.json();

    expect(createSessionsResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Get user information", async () => {
    const userResponse = await fetch(`${webserver.originAPI}/user/`, {
      headers: {
        cookie: `session_id=${createSessionsResponseBody.token}`,
      },
    });
    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();

    expect(userResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: createUserResponseBody.username,
      email: userResponseBody.email,
      created_at: createUserResponseBody.created_at,
      updated_at: userResponseBody.updated_at,
      features: userResponseBody.features,
    });
    expect(
      userResponseBody.updated_at > createUserResponseBody.updated_at,
    ).toBe(true);
    expect(userResponseBody.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });
});
