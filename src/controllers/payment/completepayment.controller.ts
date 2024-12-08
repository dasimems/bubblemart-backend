import { MongoError } from "mongodb";
import OrderSchema from "../../models/OrdersModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  decryptData,
  getOrderEncryptKey
} from "../../modules";
import { ControllerType } from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";

const completePaymentController: ControllerType = async (req, res) => {
  const { params } = req;

  const { auth, orderId } = params;
  try {
    const orderDetails = await OrderSchema.findById(orderId);
    if (!orderDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Unable to determine order!"));
    }
    const decryptedData = decryptData(
      decodeURIComponent(auth),
      getOrderEncryptKey(
        orderDetails?.id,
        orderDetails?.userId?.toString(),
        new Date(
          orderDetails?.paymentInitiatedAt ||
            orderDetails?.createdAt ||
            new Date()
        ).getTime()
      )
    );
    if (!decryptedData) {
      return res.status(400).json(constructErrorResponseBody("Bad response!"));
    }
    const updateCartsPromise = Promise.all(
      (orderDetails?.cartItems || []).map((id) =>
        CartSchema.findByIdAndUpdate(id, {
          paidAt: new Date(),
          lastUpdatedAt: new Date(),
          $push: {
            updates: {
              $each: [
                {
                  description: `Payment made!`,
                  updatedAt: new Date()
                }
              ]
            }
          }
        })
      )
    );
    const updateOrderPromise = OrderSchema.findByIdAndUpdate(orderId, {
      paidAt: new Date(),
      lastUpdatedAt: new Date(),
      $push: {
        updates: {
          $each: [
            {
              description: `Payment successfully made!`,
              updatedAt: new Date()
            }
          ]
        }
      }
    });

    await Promise.all([updateCartsPromise, updateOrderPromise]);
    return res
      .status(200)
      .json(constructSuccessResponseBody({ message: "Payment verified" }));
  } catch (error) {
    return res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as MongoError)?.message || defaultErrorMessage
        )
      );
  }
};

export default completePaymentController;
