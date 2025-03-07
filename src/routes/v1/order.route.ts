import { Router } from "express";
import getOrdersController from "../../controllers/order/getorders.controller";
import createOrderController from "../../controllers/order/createorder.controller";
import getOrderDetailsController from "../../controllers/order/getorderdetails.controller";
import { allPaths } from "../../utils/variables";
import orderDeliveredController from "../../controllers/order/orderdelivered.controller";

const orderRoute = Router();

orderRoute.route("/").get(getOrdersController).post(createOrderController);
orderRoute.route("/:id").get(getOrderDetailsController);
orderRoute
  .route(`${allPaths.delivered}/:orderId`)
  .post(orderDeliveredController);

export default orderRoute;
