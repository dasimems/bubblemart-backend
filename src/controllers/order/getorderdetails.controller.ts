import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  generateAmount
} from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType,
  PaystackInitiateTransactionResponseType,
  UserDetailsType
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
    let orderDetailsPromise = OrderSchema.findById(id).populate<
      CartDetailsType | UserDetailsType
    >({
      path: "cartItems",
      model: databaseKeys.carts,
      select: "-__v",
      options: {
        strictPopulate: false // Ensures no errors if the product doesn't exist
      }
    });

    if (isAdmin) {
      orderDetailsPromise = orderDetailsPromise.populate<UserDetailsType>({
        path: "userId",
        model: databaseKeys.users,
        select: "-password -__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      });
    }

    const orderDetails = await orderDetailsPromise; /* .lean() */
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
    const doesPaymentDetailsExist = await redisClient.exists(
      orderDetails?._id?.toString()
    );

    if (doesPaymentDetailsExist) {
      const paymentDetails = await redisClient.get(
        orderDetails?._id?.toString()
      );
      if (paymentDetails) {
        checkoutDetails = JSON.parse(paymentDetails);
      }
    }

    const userDetails = orderDetails?.userId as unknown as Document<
      string,
      unknown,
      UserDetailsType
    > &
      UserDetailsType;

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
        createdAt: details?.createdAt,
        isAvailable: false
      })),
      id: orderDetails?._id?.toString(),
      paidAt: orderDetails?.paidAt,
      paymentInitiatedAt: orderDetails?.paymentInitiatedAt,
      paymentReference: orderDetails?.paymentReference,
      refundedAt: orderDetails?.refundedAt,
      contactInformation: orderDetails?.contactInformation,
      status: orderDetails?.status,
      checkoutDetails,
      createdAt: orderDetails?.createdAt,
      user:
        isAdmin &&
        typeof userDetails !== "string" &&
        typeof userDetails !== "undefined"
          ? {
              avatar: userDetails?.avatar,
              createdAt: userDetails?.createdAt,
              email: userDetails?.email,
              id: userDetails?.id?.toString() as string,
              name: userDetails?.name,
              role: userDetails?.role,
              updatedAt: userDetails?.updatedAt
            }
          : {
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

export default getOrderDetailsController;
