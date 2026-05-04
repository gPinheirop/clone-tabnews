import email from "infra/email";
import orchestrator from "../api/v1/orchestrator";

beforeAll(async () => {
  await orchestrator.awaitForAllServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "Teste <teste@email.com>",
      to: "teste2@email.com",
      subject: "validação do fluxo de email",
      text: "teste de corpo",
    });
    await email.send({
      from: "Teste <teste@email.com>",
      to: "teste2@email.com",
      subject: "validação do fluxo de email 2",
      text: "ultimo email",
    });
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<teste@email.com>");
    expect(lastEmail.recipients[0]).toBe("<teste2@email.com>");
    expect(lastEmail.subject).toBe("validação do fluxo de email 2");
    expect(lastEmail.text).toBe("ultimo email\n");
  });
});
