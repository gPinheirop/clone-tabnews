import controller from "infra/controller";
import migrator from "models/migrator";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(_, response) {
  const prendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(prendingMigrations);
}

async function postHandler(_, response) {
  const finishedMigrations = await migrator.runPendingMigrations();

  if (finishedMigrations.length > 0) {
    return response.status(201).json(finishedMigrations);
  }
  return response.status(200).json(finishedMigrations);
}
