import { MongoError } from "mongodb";
import CartSchema from "../../models/CartModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  createOrder,
  generateAmount
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType,
  OrderDetailsResponseType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";

const createOrderController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  try {
    const cartDetails = await CartSchema.find({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }]
    });
    const cartItems = cartDetails.map((cart) => cart.id);
    if (cartItems.length < 1) {
      return res
        .status(400)
        .json(constructErrorResponseBody("No cart item found!"));
    }
    const orderDetails = await OrderSchema.create(
      createOrder(cartItems, fetchedUserDetails?.id)
    );
    if (!orderDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred! Unable to create order!"
          )
        );
    }
    const { id, createdAt } = orderDetails;
    await Promise.all(
      cartItems.map((id) =>
        CartSchema.findByIdAndUpdate(id, {
          orderId: orderDetails?.id,
          $push: {
            updates: {
              $each: [
                {
                  description: `Created order on ${new Date()}`,
                  updatedAt: new Date()
                }
              ]
            }
          }
        })
      )
    );
    const data: OrderDetailsResponseType = {
      id,
      createdAt,
      cartItems: cartDetails.map(({ id, productDetails, quantity }) => ({
        id,
        productDetails,
        quantity,
        totalPrice: generateAmount(
          (quantity || 0) * (productDetails?.amount?.whole || 0)
        ),
        isAvailable: false
      }))
    };
    return res.status(200).json(constructSuccessResponseBody(data));
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

export default createOrderController;
