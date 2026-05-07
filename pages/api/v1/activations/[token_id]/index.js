import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";
import { createRouter } from "next-connect";

const router = createRouter();
router
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);
async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenId = request.query.token_id;

  const validActivationToken =
    await activation.findValidById(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActvationToken =
    await activation.maskTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActvationToken,
  );

  return response.status(200).json(secureOutputValues);
}
