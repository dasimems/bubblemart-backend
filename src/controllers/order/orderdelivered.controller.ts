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

const deliveredDate = new Date();
const changeOrderToDelivered = async (orderId: Types.ObjectId | string) => {
  const cartYetToBeDeliveredCount = await CartSchema.countDocuments({
    orderId,
    $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
  });
  if (cartYetToBeDeliveredCount === 0) {
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

const orderDeliveredController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;

  if (fetchedUserDetails?.role !== "ADMIN") {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { cartId, orderId } = params || {};

  try {
    if (cartId) {
      const isCartExist = CartSchema.exists({
        _id: cartId
      });

      if (!isCartExist) {
        return res
          .status(404)
          .json(constructErrorResponseBody("Cart not found"));
      }
      const cartDetails = await CartSchema.findByIdAndUpdate(cartId, {
        lastUpdatedAt: deliveredDate,
        deliveredAt: deliveredDate,
        $push: {
          updates: {
            $each: [
              {
                description: `Product delivered!`,
                updatedAt: deliveredDate
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
    const orderExist = OrderSchema.exists({
      _id: orderId
    });
    if (!orderExist) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Order not found"));
    }
    const orderDetailsPromise = OrderSchema.bulkWrite(
      [
        {
          updateOne: {
            filter: {
              _id: orderId,
              $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
            },
            update: {
              lastUpdatedAt: deliveredDate,
              deliveredAt: deliveredDate,
              status: "DELIVERED",
              $push: {
                updates: {
                  $each: [
                    {
                      description: `Order delivered!`,
                      updatedAt: deliveredDate
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

    const cartUpdatePromise = CartSchema.bulkWrite(
      [
        {
          updateMany: {
            filter: {
              orderId: orderId,
              $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }]
            },
            update: {
              $set: {
                deliveredAt: deliveredDate,
                lastUpdatedAt: deliveredDate,
                $push: {
                  updates: {
                    $each: [
                      {
                        description: `Product delivered!`,
                        updatedAt: deliveredDate
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      ],
      { ordered: false }
    );
    await Promise.all([orderDetailsPromise, cartUpdatePromise]);
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
