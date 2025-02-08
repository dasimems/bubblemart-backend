import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  generateAmount
} from "../../modules";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import {
  CartDetailsType,
  ControllerType,
  OrderDetailsResponseType
} from "../../utils/types";
import OrderSchema from "../../models/OrdersModel";
import paystackApi from "../../apis/paystack.api";
import { PaystackVerificationResponse } from "../../apis/paystack";
import { Document } from "mongoose";

const verifyPaymentController: ControllerType = async (req, res) => {
  const { params } = req;
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

    if (!orderDetails?.paidAt || !orderDetails?.paymentReference) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Payment details not found!"));
    }
    const { data } = await paystackApi.get<PaystackVerificationResponse>(
      `/transaction/verify/${orderDetails?.paymentReference}`
    );
    const { channel } = data?.data || {};
    if (!data?.status) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Payment details not found!"));
    }
    const dataToSend: OrderDetailsResponseType = {
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
      checkoutDetails: null,
      paymentMethod: channel
    };
    res.status(200).json(constructSuccessResponseBody(dataToSend));
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

export default verifyPaymentController;
