import { MongoError } from "mongodb";
import OrderSchema from "../../models/OrdersModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  generateAmount,
  getBaseUrl
} from "../../modules";
import {
  AuthenticationDestructuredType,
  CartDetailsType,
  ControllerType,
  OrderDetailsResponseType,
  UserDetailsType
} from "../../utils/types";
import {
  databaseKeys,
  defaultErrorMessage,
  MAX_RETURN_ITEM_COUNT
} from "../../utils/variables";
import { Document } from "mongoose";
import { redisClient } from "../../app";

const getOrdersController: ControllerType = async (req, res) => {
  const { body, query } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;

  let { page } = query;
  const { isAdmin: isAdminQuery } = query;
  const isAdmin = JSON.parse(isAdminQuery?.toString() || "false");

  if (
    !fetchedUserDetails ||
    (isAdmin && fetchedUserDetails?.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  if (!page) {
    page = `1`;
  }
  try {
    const formattedPage = parseInt(page?.toString());
    const totalProducts = await OrderSchema.countDocuments();
    const maxPage = Math.ceil(totalProducts / MAX_RETURN_ITEM_COUNT) || 1;
    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = MAX_RETURN_ITEM_COUNT * (formattedPage - 1);

    const orderPromise = OrderSchema.find(
      !isAdmin
        ? {
            userId: fetchedUserDetails.id
          }
        : {}
    ).populate<CartDetailsType>({
      path: "cartItems",
      model: databaseKeys.carts,
      select: "-__v",
      options: {
        strictPopulate: false // Ensures no errors if the product doesn't exist
      }
    });

    if (isAdmin) {
      orderPromise.populate<UserDetailsType>({
        path: "userId",
        model: databaseKeys.users,
        select: "-__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      });
    }
    const orderList = await orderPromise
      .skip(skip)
      .limit(MAX_RETURN_ITEM_COUNT)
      .exec(); /* OrderSchema.find(
      !isAdmin
        ? {
            userId: fetchedUserDetails.id
          }
        : {}
    )
      .populate<CartDetailsType>({
        path: "cartItems",
        model: databaseKeys.carts,
        select: "-__v",
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      })
      .skip(skip)
      .limit(MAX_RETURN_ITEM_COUNT)
      .exec(); */
    const orderCheckoutDetails = await Promise.all(
      orderList.map((order) => redisClient.get(order?.id))
    );
    const orders: OrderDetailsResponseType[] = orderList.map((order, index) => {
      const checkoutDetails = orderCheckoutDetails[index];
      const userDetails = order?.userId as unknown as Document<
        string,
        unknown,
        UserDetailsType
      > &
        UserDetailsType;
      return {
        id: order?.id,
        paidAt: order?.paidAt,
        paymentInitiatedAt: order?.paymentInitiatedAt,
        paymentReference: order?.paymentReference,
        refundedAt: order?.refundedAt,
        contactInformation: order?.contactInformation,
        status: order?.status,
        cartItems: (
          (order?.cartItems || []) as unknown as (Document<
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
        checkoutDetails: checkoutDetails ? JSON.parse(checkoutDetails) : null,
        createdAt: order?.createdAt,
        user:
          isAdmin &&
          typeof userDetails !== "string" &&
          typeof userDetails !== "undefined" &&
          typeof userDetails !== typeof order?.userId
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
    });

    const canShowPreviousLink = formattedPage > 1;
    const canShowNextLink = formattedPage < maxPage;
    res.status(200).json(
      constructSuccessResponseBody(
        orders,
        totalProducts,
        maxPage,
        formattedPage,
        canShowPreviousLink
          ? {
              host,
              link,
              route,
              baseUrl: getBaseUrl(req.protocol, host),
              commonUrl: `${route.replace("/v1", "")}?page=${formattedPage - 1}`
            }
          : undefined,
        canShowNextLink
          ? {
              host,
              link,
              route,
              baseUrl: getBaseUrl(req.protocol, host),
              commonUrl: `${route.replace("/v1", "")}?page=${formattedPage + 1}`
            }
          : undefined
      )
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

export default getOrdersController;
