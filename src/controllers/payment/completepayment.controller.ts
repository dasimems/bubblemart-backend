import { MongoError } from "mongodb";
import OrderSchema from "../../models/OrdersModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  verifyPaystackTransaction
} from "../../modules";
import { CartDetailsType, ControllerType } from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";
import ProductSchema from "../../models/ProductModel";
import { redisClient } from "../../app";
import { PaystackWebhookEvent } from "../../apis/paystack";
import { Document } from "mongoose";

export const updateOrderProduct = (orderDetails, paidAt) => {
  const updateCartsPromise = Promise.all(
    (
      (orderDetails?.cartItems || []) as unknown as (Document<
        string,
        unknown,
        CartDetailsType
      > &
        CartDetailsType)[]
    ).map((cart) =>
      CartSchema.findByIdAndUpdate(cart?.id, {
        paidAt: new Date(paidAt),
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
      }).lean()
    )
  );
  const updateOrderPromise = OrderSchema.findByIdAndUpdate(orderDetails?.id, {
    paidAt: new Date(paidAt),
    lastUpdatedAt: new Date(),
    status: "PAID",
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
  }).lean();
  const cartList = (
    orderDetails?.cartItems as unknown as CartDetailsType[]
  ).filter((cart) => cart?.productDetails?.id);

  const updateProductPromise = Promise.all(
    cartList.map((cart) =>
      ProductSchema.findByIdAndUpdate(cart?.productDetails?.id, {
        $set: {
          "cartItems.$.quantity": {
            $cond: {
              if: {
                $lt: [
                  {
                    $subtract: ["$cartItems.quantity", cart?.quantity || 0]
                  },
                  1
                ]
              }, // Subtract but make sure it doesn't drop below 1
              then: 0, // Set to 0 if less than 1
              else: {
                $subtract: ["$cartItems.quantity", cart?.quantity || 0]
              } // Otherwise, subtract
            }
          }
        }
      }).lean()
    )
  );

  const deleteRedisRecordPromise = redisClient.del(orderDetails?.id);
  return Promise.all([
    updateCartsPromise,
    updateOrderPromise,
    updateProductPromise,
    deleteRedisRecordPromise
  ]);
};

const completePaymentController: ControllerType = async (req, res) => {
  const { body, headers } = req;
  const { event, data } = body as PaystackWebhookEvent;
  const signature = headers["x-paystack-signature"];

  if (!verifyPaystackTransaction(body, signature?.toString() || "")) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid signature!"));
  }
  try {
    if (event === "charge.success") {
      const { reference, paid_at } = data;

      const orderDetails = await OrderSchema.findOne({
        paymentReference: reference
      })
        .populate<CartDetailsType>({
          path: "cartItems",
          model: databaseKeys.carts,
          select: "-__v",
          options: {
            strictPopulate: false // Ensures no errors if the product doesn't exist
          }
        })
        .lean();

      if (!orderDetails) {
        return res
          .status(404)
          .json(constructErrorResponseBody("Unable to determine order!"));
      }

      // const allLogProducts = cartList.filter(
      //   (cart) => cart?.productDetails?.type === "log"
      // );
      await updateOrderProduct(orderDetails, paid_at);
      return res
        .status(200)
        .json(constructSuccessResponseBody({ message: "Payment verified" }));
    }

    return res
      .status(400)
      .json(constructErrorResponseBody("No registered event!"));
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
