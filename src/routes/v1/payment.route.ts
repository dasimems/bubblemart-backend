import { Router } from "express";
import completePaymentController from "../../controllers/payment/completepayment.controller";
import createPaymentController from "../../controllers/payment/createpayment.controller";
import verifyPaymentController from "../../controllers/payment/verifyorderpayment.controller";

const paymentRoute = Router();

paymentRoute
  .route("/:id")
  .post(createPaymentController)
  .get(verifyPaymentController);
paymentRoute
  .route("/paystack/webhook")
  .post(completePaymentController)
  .get(completePaymentController);

export default paymentRoute;
