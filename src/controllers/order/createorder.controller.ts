import { MongoError } from "mongodb";
import CartSchema from "../../models/CartModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  createOrder,
  formatJoiErrors,
  generateAmount
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType,
  OrderDetailsResponseType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
import Joi, { ValidationError } from "joi";
import AddressSchema from "../../models/AddressModel";
import { Schema } from "mongoose";

export type CreateOrderBodyType = {
  address: string;
} & AuthenticationDestructuredType;

const createOrderBodySchema = Joi.object<CreateOrderBodyType>({
  address: Joi.string().optional()
}).unknown(true);

const createOrderController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails, address } = body as CreateOrderBodyType;

  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = createOrderBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const fetchCartPromise = CartSchema.find({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }]
    });

    const availableGiftCountPromise = CartSchema.countDocuments({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }],
      "productDetails.type": "gift" // Check if order is not null
    });
    const [cartDetails, availableGiftCount] = await Promise.all([
      fetchCartPromise,
      availableGiftCountPromise
    ]);

    if (availableGiftCount > 0 && !address) {
      return res
        .status(400)
        .json(
          constructErrorResponseBody(
            "Address required to perform this operation!"
          )
        );
    }

    if (availableGiftCount > 0 || address) {
      const addressDetails = await AddressSchema.findById(address);

      if (!addressDetails) {
        return res
          .status(404)
          .json(constructErrorResponseBody("Address not found!"));
      }
    }

    const cartItems = cartDetails.map((cart) => cart.id);
    if (cartItems.length < 1) {
      return res
        .status(400)
        .json(constructErrorResponseBody("No cart item found!"));
    }
    const orderDetails = await OrderSchema.create(
      createOrder(
        cartItems,
        fetchedUserDetails?.id,
        (address as unknown as Schema.Types.ObjectId) || undefined
      )
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
