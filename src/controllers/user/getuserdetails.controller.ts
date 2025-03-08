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
  OrderDetailsResponseType,
  PaystackInitiateTransactionResponseType,
  UserDetailsResponseType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import UserModel from "../../models/UserModel";
import CartSchema from "../../models/CartModel";
import OrderSchema from "../../models/OrdersModel";
import { Document } from "mongoose";
import { redisClient } from "../../app";

const getUserDetailsController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { id: userId } = params || {};
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails || (userId && fetchedUserDetails.role !== "ADMIN")) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  if (!userId) {
    const { id, avatar, updatedAt, createdAt, role, name, email } =
      fetchedUserDetails;
    const data: UserDetailsResponseType = {
      avatar,
      createdAt,
      email,
      id: id?.toString(),
      name,
      role,
      updatedAt
    };
    return res.status(200).json(constructSuccessResponseBody(data));
  }

  try {
    const userDetailsPromise = UserModel.findById(userId).lean();
    const totalCartPromise = CartSchema.countDocuments({
      userId,
      $or: [{ orderId: { $exists: false } }, { orderId: null }]
    });
    const totalOrderPromise = OrderSchema.countDocuments({ userId });
    const totalCompletedOrderPromise = OrderSchema.countDocuments({
      userId,
      paidAt: {
        $exists: true,
        $ne: null
      }
    });
    const lastOrderMadePromise = OrderSchema.findOne({
      userId,
      paidAt: {
        $exists: true,
        $ne: null
      }
    })
      .sort({ paidAt: -1 })
      .populate<CartDetailsType>({
        path: "cartItems",
        model: databaseKeys.carts,
        select: "-__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      })
      .lean();
    const [
      userDetails,
      totalCarts,
      totalOrders,
      totalCompletedOrders,
      lastOrderMade
    ] = await Promise.all([
      userDetailsPromise,
      totalCartPromise,
      totalOrderPromise,
      totalCompletedOrderPromise,
      lastOrderMadePromise
    ]);
    if (!userDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("User doesn't exist"));
    }

    let data: UserDetailsResponseType = {
      avatar: userDetails?.avatar,
      createdAt: userDetails?.createdAt,
      email: userDetails?.email,
      id: userDetails?._id?.toString() as string,
      name: userDetails?.name,
      role: userDetails?.role,
      updatedAt: userDetails?.updatedAt,
      totalCarts,
      totalOrders,
      totalCompletedOrders
    };
    if (lastOrderMade) {
      let checkoutDetails: PaystackInitiateTransactionResponseType | null =
        null;
      const doesPaymentDetailsExist = await redisClient.exists(
        lastOrderMade?._id?.toString()
      );

      if (doesPaymentDetailsExist) {
        const paymentDetails = await redisClient.get(
          lastOrderMade?._id?.toString()
        );
        if (paymentDetails) {
          checkoutDetails = JSON.parse(paymentDetails);
        }
      }
      const lastMadeOrder: OrderDetailsResponseType = {
        cartItems: (
          (lastOrderMade?.cartItems || []) as unknown as (Document<
            string,
            unknown,
            CartDetailsType
          > &
            CartDetailsType)[]
        )?.map((details) => ({
          id: details._id?.toString(),
          productDetails: details.productDetails,
          quantity: details.quantity,
          totalPrice: generateAmount(
            (details?.quantity || 0) *
              (details?.productDetails?.amount?.whole || 0)
          ),
          createdAt: details?.createdAt,
          isAvailable: false,
          deliveredAt: details?.deliveredAt
        })),
        id: lastOrderMade?._id?.toString(),
        paidAt: lastOrderMade?.paidAt,
        paymentInitiatedAt: lastOrderMade?.paymentInitiatedAt,
        paymentReference: lastOrderMade?.paymentReference,
        refundedAt: lastOrderMade?.refundedAt,
        contactInformation: lastOrderMade?.contactInformation,
        status: lastOrderMade?.status,
        checkoutDetails,
        deliveredAt: lastOrderMade?.deliveredAt,
        createdAt: lastOrderMade?.createdAt
      };
      data = { ...data, lastMadeOrder };
    }
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

export default getUserDetailsController;
