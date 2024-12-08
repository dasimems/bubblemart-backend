import { MongoError } from "mongodb";
import { constructErrorResponseBody, generateAmount } from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
import { OrderDetailsResponseType } from "../../utils/types";
import { Document } from "mongoose";

const getOrderDetailsController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Order ID is required!"));
  }

  try {
    const orderDetails = await OrderSchema.findById(
      id
    ).populate<CartDetailsType>({
      path: "cartItems",
      model: databaseKeys.carts,
      select: "-__v",
      options: {
        strictPopulate: false // Ensures no errors if the product doesn't exist
      }
    });
    if (!orderDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Order details not found!"));
    }

    const data: OrderDetailsResponseType = {
      cartItems: (
        (orderDetails?.cartItems || []) as unknown as (Document<
          string,
          unknown,
          CartDetailsType
        > &
          CartDetailsType)[]
      )?.map((details) => ({
        id: details.id,
        productDetails: details.productDetails,
        quantity: details.quantity,
        totalPrice: generateAmount(
          (details?.quantity || 0) *
            (details?.productDetails?.amount?.whole || 0)
        ),
        isAvailable: false
      })),
      id: orderDetails?.id,
      orderNo: orderDetails?.orderNo,
      paidAt: orderDetails?.paidAt,
      paymentInitiatedAt: orderDetails?.paymentInitiatedAt,
      paymentReference: orderDetails?.paymentReference,
      refundedAt: orderDetails?.refundedAt
    };

    return res.status(200).json(data);
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

export default getOrderDetailsController;
