import { Router } from "express";
import completePaymentController from "../../controllers/payment/completepayment.controller";
import createPaymentController from "../../controllers/payment/createpayment.controller";

const paymentRoute = Router();

paymentRoute.route("/:id").post(createPaymentController);
paymentRoute
  .route("/:orderId/:auth")
  .post(completePaymentController)
  .get(completePaymentController);

export default paymentRoute;
