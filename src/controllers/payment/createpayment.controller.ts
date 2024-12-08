import { MongoError } from "mongodb";
import { constructErrorResponseBody } from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import OrderSchema from "../../models/OrdersModel";
import opayApi from "../../apis/opay.api";

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

const createPaymentController: ControllerType = async (req, res) => {
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

    const paymentDetails = {
      amount: {
        currency: "NGN",
        total: totalPrice
      },
      callbackUrl:
        "https://testapi.opaycheckout.com/api/v1/international/print",
      country: "NG",
      customerName: fetchedUserDetails?.name,
      payMethod: "BankTransfer",
      product: {
        description: "dd",
        name: "name"
      },
      reference: "123456",
      userPhone: "+1234567879"
    };
    const { data } = await opayApi.post<OpayResponseType>(
      "https://testapi.opaycheckout.com/api/v1/international/payment/create",
      paymentDetails
    );
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
