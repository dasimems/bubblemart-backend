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
  ContactInformationType,
  ControllerType,
  OrderDetailsResponseType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
import Joi, { ValidationError } from "joi";
import { phoneNumberRegExp } from "../../utils/regex";

export type CreateOrderBodyType = ContactInformationType &
  AuthenticationDestructuredType;

const createOrderBodySchema = Joi.object<CreateOrderBodyType>({
  senderName: Joi.string().required().messages({
    "string.empty": "Sender name is required",
    "any.required": "Sender name is required",
    "string.pattern.base": "Please input a valid name"
  }),
  receiverAddress: Joi.string().required().messages({
    "string.empty": "Receiver address is required",
    "any.required": "Receiver address is required",
    "string.pattern.base": "Please input a valid address"
  }),
  receiverName: Joi.string().required().messages({
    "string.empty": "Receiver name is required",
    "any.required": "Receiver name is required",
    "string.pattern.base": "Please input a valid name"
  }),
  receiverPhoneNumber: Joi.string()
    .regex(phoneNumberRegExp)
    .required()
    .messages({
      "string.empty": "Receiver phone number is required",
      "any.required": "Receiver phone number is required",
      "string.pattern.base": "Please input a valid mobile number"
    }),
  longitude: Joi.number().required().min(-180).max(180).messages({
    "number.base": "Longitude must be a valid number",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180"
  }),
  latitude: Joi.number().required().min(-90).max(90).messages({
    "number.base": "Latitude must be a valid number",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90"
  }),
  shortNote: Joi.string().optional().empty(["", null])
}).unknown(true);

const createOrderController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails, ...contactDetails } = body as CreateOrderBodyType;

  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
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
    const hasAvailableGift = availableGiftCount > 0;

    if (hasAvailableGift) {
      const { error } = createOrderBodySchema.validate(body, {
        abortEarly: false
      });
      const errors = formatJoiErrors(error as ValidationError);

      if (errors) {
        return res
          .status(400)
          .json(
            constructErrorResponseBody(
              "Please fill in your contact information to continue",
              errors
            )
          );
      }
    }

    const {
      receiverAddress,
      receiverName,
      receiverPhoneNumber,
      senderName,
      shortNote,
      longitude,
      latitude
    } = contactDetails;

    const contactInformation: ContactInformationType = {
      receiverAddress,
      receiverName,
      receiverPhoneNumber,
      senderName,
      shortNote,
      longitude,
      latitude
    };

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
        hasAvailableGift ? contactInformation : undefined
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
    const { id, createdAt, status } = orderDetails;
    await Promise.all(
      cartItems.map(
        (id) =>
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
          }) /* .lean() */
      )
    );
    const data: OrderDetailsResponseType = {
      id,
      createdAt,
      cartItems: cartDetails.map(
        ({ id, productDetails, quantity, deliveredAt }) => ({
          id,
          productDetails,
          quantity,
          totalPrice: generateAmount(
            (quantity || 0) * (productDetails?.amount?.whole || 0)
          ),
          isAvailable: false,
          deliveredAt
        })
      ),
      contactInformation: hasAvailableGift ? contactInformation : null,
      status,
      checkoutDetails: null,
      paidAt: orderDetails?.paidAt,
      paymentInitiatedAt: orderDetails?.paymentInitiatedAt,
      paymentReference: orderDetails?.paymentReference,
      deliveredAt: orderDetails?.deliveredAt,
      refundedAt: orderDetails?.refundedAt,
      user: {
        avatar: fetchedUserDetails?.avatar,
        createdAt: fetchedUserDetails?.createdAt,
        email: fetchedUserDetails?.email,
        id: fetchedUserDetails?.id?.toString() as string,
        name: fetchedUserDetails?.name,
        role: fetchedUserDetails?.role,
        updatedAt: fetchedUserDetails?.updatedAt
      }
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
