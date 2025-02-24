import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors
} from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType,
  PaystackInitiateTransactionResponseType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
// import opayApi from "../../apis/opay.api";
import paystackApi from "../../apis/paystack.api";
import { redisClient } from "../../app";
import Joi, { ValidationError } from "joi";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;
const isProduction = env?.ENVIRONMENT === "production";

export type OpayResponseType = {
  code: string;
  message: string;
  data: {
    reference: string;
    orderNo: string;
    nextAction: {
      actionType: string;
      transferAccountNumber: string;
      transferBankName: string;
      expiredTimestamp: number;
    };
    status: "PENDING";
    amount: {
      total: number;
      currency: string;
    };
    vat: {
      total: number;
      currency: string;
    };
  };
};

type CreatePaymentBodyType = {
  callbackUrl: string;
} & AuthenticationDestructuredType;

const createPaymentJoiSchema = Joi.object<CreatePaymentBodyType>({
  callbackUrl: Joi.string()
    .uri({ scheme: isProduction ? ["https"] : ["https", "http"] })
    .required()
    .messages({
      "string.empty": "Please upload your image",
      "any.required": "You have to upload a image",
      "string.uri": "Invalid image detected"
    })
}).unknown(true);

const createPaymentController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails, callbackUrl } = body as CreatePaymentBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  const { error } = createPaymentJoiSchema.validate(body, {
    abortEarly: false
  });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(
        constructErrorResponseBody(
          "Invalid or no callback url detected",
          errors
        )
      );
  }
  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Order ID is required!"));
  }

  try {
    const orderDetails = await OrderSchema.findById(id)
      .populate<CartDetailsType>({
        path: "cartItems",
        model: databaseKeys.carts,
        select: "-__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      })
      .lean();
    if (!orderDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Order details not found!"));
    }

    if (orderDetails.paidAt) {
      return res
        .status(409)
        .json(constructErrorResponseBody("Payment already made!"));
    }

    const { cartItems } = orderDetails;
    let totalPrice = 0;
    (cartItems as unknown as CartDetailsType[]).forEach((details) => {
      const cartPrice =
        (details?.quantity || 0) *
        (details?.productDetails?.amount?.amount || 0);
      totalPrice += cartPrice;
    });

    // const price = generateAmount(totalPrice);

    // if (!price) {
    //   return res
    //     .status(400)
    //     .json(constructErrorResponseBody("Price not determined!"));
    // }

    const paymentInitiatedTime = new Date();

    const paymentBody = {
      email: fetchedUserDetails?.email,
      amount: totalPrice,
      currency: "NGN",
      callback_url: callbackUrl
    };

    const { data } =
      await paystackApi.post<PaystackInitiateTransactionResponseType>(
        "/transaction/initialize",
        paymentBody
      );

    const { data: paymentDetails } = data;

    if (!paymentDetails) {
      res
        .status(500)
        .json(constructErrorResponseBody("Couldn't initiate payment!"));
    }

    const redisClientPromise = redisClient.set(
      orderDetails?._id?.toString(),
      JSON.stringify(paymentDetails)
    );
    const updateOrderDetailsPromise = OrderSchema.findByIdAndUpdate(
      orderDetails?._id?.toString(),
      {
        paymentReference: paymentDetails?.reference,
        paymentInitiatedAt: paymentInitiatedTime,
        lastUpdatedAt: new Date(),
        $push: {
          updates: {
            $each: [
              {
                description: `Payment initiated!`,
                updatedAt: new Date()
              }
            ]
          }
        }
      }
    );

    await Promise.all([redisClientPromise, updateOrderDetailsPromise]);

    res.status(201).json(constructSuccessResponseBody(paymentDetails));

    // const paymentDetails = {
    //   amount: {
    //     currency: "NGN",
    //     total: totalPrice
    //   },
    //   callbackUrl:
    //     "https://testapi.opaycheckout.com/api/v1/international/print",
    //   country: "NG",
    //   customerName: fetchedUserDetails?.name,
    //   payMethod: "BankTransfer",
    //   product: {
    //     description: "dd",
    //     name: "name"
    //   },
    //   reference: "123456",
    //   userPhone: "+1234567879"
    // };
    // const { data } = await opayApi.post<OpayResponseType>(
    //   "https://testapi.opaycheckout.com/api/v1/international/payment/create",
    //   paymentDetails
    // );
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

export default createPaymentController;
