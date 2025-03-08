import { MongoError } from "mongodb";
import OrderSchema from "../../models/OrdersModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  verifyPaystackTransaction
} from "../../modules";
import {
  CartDetailsType,
  ControllerType,
  OrderDetailsType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";
import ProductSchema from "../../models/ProductModel";
import { redisClient } from "../../app";
import { PaystackWebhookEvent } from "../../apis/paystack";
import { Document, MergeType, Types } from "mongoose";
import LogSchema from "../../models/LogsModel";

export const updateOrderProduct = async (
  orderDetails: Document<
    unknown,
    {},
    MergeType<OrderDetailsType, CartDetailsType>
  > &
    Omit<OrderDetailsType, keyof CartDetailsType> &
    CartDetailsType & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  paidAt: Date | string
) => {
  const { userId } = orderDetails || {};
  const orderId = orderDetails?.id || orderDetails?._id;
  if (!userId) {
    return;
  }
  const updateCartsPromise = CartSchema.bulkWrite([
    {
      updateMany: {
        filter: { orderId },
        update: {
          $set: {
            paidAt: new Date(paidAt),
            lastUpdatedAt: new Date()
          },
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
        }
      }
    }
  ]);
  const updateOrderPromise = OrderSchema.updateOne(
    { _id: orderId },
    {
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
    }
  ); /* .lean() */
  const cartList = (
    orderDetails?.cartItems as unknown as (CartDetailsType & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    })[]
  ).filter((cart) => cart?.productDetails?.id);

  const logCarts = cartList.filter(
    (cart) => cart?.productDetails?.type === "log"
  );

  const logsToUpdatePromise = Promise.all(
    logCarts.map((cart) =>
      LogSchema.find({
        productId: cart?.productDetails?.id,
        $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
      })
        .select("_id")
        .limit(cart?.quantity || 0)
    )
  );
  const updateProductPromise = ProductSchema.bulkWrite(
    cartList.map((cart) => ({
      updateOne: {
        filter: { _id: cart?.productDetails?.id },
        update: {
          $inc: { quantity: -Math.max(cart?.quantity || 0, 0) }, // Ensure it doesn’t go negative
          $set: { lastUpdatedAt: new Date() },
          $push: {
            updates: {
              description: `Quantity updated by subtracting ${
                cart?.quantity || 0
              }`,
              updatedAt: new Date()
            }
          }
        }
      }
    }))
  );
  const deliveredDate = new Date();

  const deleteRedisRecordPromise = redisClient.del(orderDetails?.id);
  const [logsToUpdate] = await Promise.all([
    logsToUpdatePromise,
    updateCartsPromise,
    updateOrderPromise,
    updateProductPromise,
    deleteRedisRecordPromise
  ]);

  let cartToUpdateId: Types.ObjectId[] = [];

  const updateLogList = logsToUpdate
    .map((logs, index) => {
      const cartDetails = logCarts[index];

      if (!logs || logs.length !== cartDetails?.quantity) {
        return undefined;
      }

      cartToUpdateId = [...cartToUpdateId, cartDetails?._id];
      return logs.map((log) => log._id);
    })
    .filter((promise) => promise !== undefined);

  const assignUserToLogPromise = LogSchema.bulkWrite(
    updateLogList
      .flatMap((logIds) => logIds?.map((logId) => logId) || [])
      .map((log) => ({
        updateOne: {
          filter: { _id: log._id },
          update: {
            $set: { assignedTo: userId },
            $push: {
              updates: {
                description: `Assigned to ${userId}`,
                updatedAt: new Date()
              }
            }
          }
        }
      }))
  );
  const updateCartPromise = CartSchema.bulkWrite(
    cartToUpdateId.map((_id) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: { deliveredAt: deliveredDate },
          $push: {
            updates: {
              description: `Delivered at ${deliveredDate}`,
              updatedAt: deliveredDate
            }
          }
        }
      }
    }))
  );
  await Promise.all([assignUserToLogPromise, updateCartPromise]);
  const cartExist = await CartSchema.exists({
    orderId,
    $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
  });
  if (!cartExist) {
    await OrderSchema.updateOne(
      { _id: orderId },
      {
        $set: { deliveredAt: deliveredDate, status: "DELIVERED" },
        $push: {
          updates: {
            description: "Order delivered!",
            updatedAt: new Date()
          }
        }
      }
    );
  }
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
      }).populate<CartDetailsType>({
        path: "cartItems",
        model: databaseKeys.carts,
        select: "-__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      });
      /* .lean() */ if (!orderDetails) {
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
