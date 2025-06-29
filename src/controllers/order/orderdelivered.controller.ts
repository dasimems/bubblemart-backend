import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";
import OrderSchema from "../../models/OrdersModel";
import { Types } from "mongoose";

const changeOrderToDelivered = async (orderId: Types.ObjectId | string) => {
  if (!orderId) {
    return;
  }
  const cartExists = await CartSchema.exists({
    orderId,
    $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
  });
  if (!cartExists) {
    await OrderSchema.updateOne(
      { _id: orderId },
      {
        $set: { deliveredAt: new Date(), status: "DELIVERED" },
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

const orderDeliveredController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;

  if (fetchedUserDetails?.role !== "ADMIN") {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { cartId, orderId } = params || {};

  try {
    if (cartId) {
      const isCartExist = await CartSchema.exists({
        _id: cartId
      });

      if (!isCartExist) {
        return res
          .status(404)
          .json(constructErrorResponseBody("Cart not found"));
      }
      const cartDetails = await CartSchema.findByIdAndUpdate(cartId, {
        lastUpdatedAt: new Date(),
        deliveredAt: new Date(),
        $push: {
          updates: {
            $each: [
              {
                description: `Product delivered!`,
                updatedAt: new Date()
              }
            ]
          }
        }
      });
      if (cartDetails && cartDetails.orderId) {
        await changeOrderToDelivered(cartDetails.orderId?.toString());
      }
      return res
        .status(200)
        .json(constructSuccessResponseBody({ message: "Cart delivered!" }));
    }
    if (!orderId) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Order id not found"));
    }
    const orderExist = await OrderSchema.exists({
      _id: orderId
    });
    if (!orderExist) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Order not found"));
    }
    await OrderSchema.updateOne(
      {
        _id: orderId,
        $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
      },
      {
        lastUpdatedAt: new Date(),
        deliveredAt: new Date(),
        status: "DELIVERED",
        $push: {
          updates: {
            description: "Order delivered!",
            updatedAt: new Date()
          }
        }
      }
    );

    await CartSchema.bulkWrite(
      [
        {
          updateMany: {
            filter: {
              orderId: orderId,
              $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
            },
            update: {
              $set: {
                deliveredAt: new Date(),
                lastUpdatedAt: new Date()
              },
              $push: {
                updates: {
                  $each: [
                    {
                      description: `Product delivered!`,
                      updatedAt: new Date()
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      { ordered: false }
    );
    // await Promise.all([orderDetailsPromise, cartUpdatePromise]);
    return res
      .status(200)
      .json(constructSuccessResponseBody({ message: "Order delivered!" }));
  } catch (error) {
    res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as MongoError)?.message || defaultErrorMessage
        )
      );
  }
};

export default orderDeliveredController;
