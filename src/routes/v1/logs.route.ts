import { Router } from "express";
import getLogsController from "../../controllers/logs/getlogs.controller";
import updateLogController from "../../controllers/logs/updatelogs.controller";

const logsRoute = Router();

logsRoute.route("/").get(getLogsController);

logsRoute
  .route(`/:productId`)
  .get(getLogsController)
  .patch(updateLogController);

export default logsRoute;
