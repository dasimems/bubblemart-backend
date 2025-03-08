import { Router } from "express";
import getLogsController from "../../controllers/logs/getlogs.controller";
import updateLogController from "../../controllers/logs/updatelogs.controller";
import deleteLogController from "../../controllers/logs/deletelog.controller";

const logsRoute = Router();

logsRoute.route("/").get(getLogsController);

logsRoute
  .route(`/:productId`)
  .get(getLogsController)
  .patch(updateLogController)
  .delete(deleteLogController);

export default logsRoute;
