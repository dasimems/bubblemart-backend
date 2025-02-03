import { MongoError } from "mongodb";
import { constructErrorResponseBody, generateAmount } from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType,
  PaystackInitiateTransactionResponseType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
import { OrderDetailsResponseType } from "../../utils/types";
import { Document } from "mongoose";
import { redisClient } from "../../app";

const getOrderDetailsController: ControllerType = async (req, res) => {
  const { body, params, query } = req;
  const { isAdmin } = query;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (
    !fetchedUserDetails ||
    (isAdmin && fetchedUserDetails?.role !== "ADMIN")
  ) {
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
    if (
      !isAdmin &&
      orderDetails?.userId?.toString() !== fetchedUserDetails?.id?.toString()
    ) {
      return res.status(403).json("Action not permitted");
    }
    let checkoutDetails: PaystackInitiateTransactionResponseType | null = null;
    const doesPaymentDetailsExist = await redisClient.exists(orderDetails?.id);

    if (doesPaymentDetailsExist) {
      const paymentDetails = await redisClient.get(orderDetails?.id);
      if (paymentDetails) {
        checkoutDetails = JSON.parse(paymentDetails);
      }
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
      paidAt: orderDetails?.paidAt,
      paymentInitiatedAt: orderDetails?.paymentInitiatedAt,
      paymentReference: orderDetails?.paymentReference,
      refundedAt: orderDetails?.refundedAt,
      contactInformation: orderDetails?.contactInformation,
      status: orderDetails?.status,
      checkoutDetails
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
