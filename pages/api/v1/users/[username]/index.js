import controller from "infra/controller";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";
import user from "models/users";
import { createRouter } from "next-connect";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;

  const requestedUser = await user.findUserByUsername(username);

  return response.status(200).json(requestedUser);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const targetUser = await user.findUserByUsername(username);
  const userTryingToPatch = request.context.user;

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui a permissão para atualizar outro usuário",
      action: "Verifique suas permissões antes de tentar novamente",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  return response.status(200).json(updatedUser);
}
