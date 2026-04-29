import controller from "infra/controller";
import user from "models/users";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;

  const requestedUser = await user.findUserByUsername(username);

  return response.status(200).json(requestedUser);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const updatedUser = await user.update(username, userInputValues);

  return response.status(200).json(updatedUser);
}
