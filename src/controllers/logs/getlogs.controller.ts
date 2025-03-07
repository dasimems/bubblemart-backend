import { MongoError } from "mongodb";
import LogSchema from "../../models/LogsModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  getBaseUrl
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType,
  LogDetailsResponseType,
  ProductDetailsType
} from "../../utils/types";
import {
  databaseKeys,
  defaultErrorMessage,
  MAX_RETURN_ITEM_COUNT
} from "../../utils/variables";
import { Document } from "mongoose";

const getLogsController: ControllerType = async (req, res) => {
  const { query, body, params } = req;
  const { productId } = params;

  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (
    !fetchedUserDetails ||
    (productId && fetchedUserDetails?.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  let { page, max } = query;

  if (!page) {
    page = `1`;
  }

  if (!max || isNaN(parseInt(max?.toString()))) {
    max = MAX_RETURN_ITEM_COUNT?.toString();
  }

  const dbQuery = productId
    ? {
        productId,
        $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }]
      }
    : { assignedTo: fetchedUserDetails._id };

  try {
    const formattedPage = parseInt(page?.toString());
    const totalProducts = await LogSchema.countDocuments(dbQuery);
    const maxPage = Math.ceil(totalProducts / parseInt(max?.toString())) || 1;
    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = parseInt(max?.toString()) * (formattedPage - 1);
    const fetchedLogs = await LogSchema.find(dbQuery)
      .populate<ProductDetailsType>({
        path: "productId",
        model: databaseKeys.products, // Replace 'Product' with your actual Product model name
        select: "-__v", // Exclude unnecessary fields if needed
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      })
      .skip(skip)
      .limit(parseInt(max?.toString()))
      /* .lean() */
      .exec();
    const formatedLog: LogDetailsResponseType[] = fetchedLogs.map((item) => {
      const productDetails = item?.productId as unknown as Document<
        string,
        unknown,
        ProductDetailsType
      > &
        ProductDetailsType;

      return {
        email: item.email,
        password: item.password,
        id: item._id?.toString(),
        assignedTo: item.assignedTo,
        productId: {
          amount: productDetails?.amount,
          description: productDetails?.description,
          id: productDetails?._id?.toString(),
          image: productDetails?.image,
          name: productDetails?.name,
          quantity: productDetails?.quantity,
          type: productDetails?.type,
          createdAt: productDetails?.createdAt
        }
      };
    });
    const canShowPreviousLink = formattedPage > 1;
    const canShowNextLink = formattedPage < maxPage;

    res.status(200).json(
      constructSuccessResponseBody(
        formatedLog,
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

export default getLogsController;
