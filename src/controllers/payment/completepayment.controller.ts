import { MongoError } from "mongodb";
import OrderSchema from "../../models/OrdersModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  decryptData,
  getOrderEncryptKey
} from "../../modules";
import { CartDetailsType, ControllerType } from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";
import ProductSchema from "../../models/ProductModel";

const completePaymentController: ControllerType = async (req, res) => {
  const { params } = req;

  const { auth, orderId } = params;
  try {
    const orderDetails = await OrderSchema.findById(
      orderId
    ).populate<CartDetailsType>({
      path: "cartItems",
      model: databaseKeys.carts,
      select: "-__v",
      options: {
        strictPopulate: false // Ensures no errors if the product doesn't exist
      }
    });
    if (!orderDetails || !orderDetails?.paymentInitiatedAt) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Unable to determine order!"));
    }
    const decryptedData = decryptData(
      decodeURIComponent(auth),
      getOrderEncryptKey(
        orderDetails?.id,
        orderDetails?.userId?.toString(),
        new Date(orderDetails?.paymentInitiatedAt).getTime()
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
    });
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
                    { $subtract: ["$cartItems.quantity", cart?.quantity || 0] },
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
        })
      )
    );
    // const allLogProducts = cartList.filter(
    //   (cart) => cart?.productDetails?.type === "log"
    // );
    await Promise.all([
      updateCartsPromise,
      updateOrderPromise,
      updateProductPromise
    ]);
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
