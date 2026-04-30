import * as cookie from "cookie";
import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";
import { createRouter } from "next-connect";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const loginInputValues = request.body;

  const authenticatedUser = await authentication.authenticateUser(
    loginInputValues.email,
    loginInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISSECONDS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(newSession);
}
