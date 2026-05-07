import controller from "infra/controller";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";
import { createRouter } from "next-connect";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const loginInputValues = request.body;

  const authenticatedUser = await authentication.authenticateUser(
    loginInputValues.email,
    loginInputValues.password,
  );

  session.canCreateSession(authenticatedUser);

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  return response.status(200).json(secureOutputValues);
}
