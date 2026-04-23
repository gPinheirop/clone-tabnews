import controller from "infra/controller";
import user from "models/users";
import { createRouter } from "next-connect";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const newUserInputValues = request.body;

  const newUser = await user.create(newUserInputValues);

  return response.status(201).json(newUser);
}
