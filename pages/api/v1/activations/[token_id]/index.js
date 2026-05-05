import controller from "infra/controller";
import activation from "models/activation";
import { createRouter } from "next-connect";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  const validActivationToken =
    await activation.findValidById(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActvationToken =
    await activation.maskTokenAsUsed(activationTokenId);

  return response.status(200).json(usedActvationToken);
}
