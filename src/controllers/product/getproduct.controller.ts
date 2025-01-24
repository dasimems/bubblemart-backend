import { MongoError } from "mongodb";
import ProductSchema from "../../models/ProductModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  getBaseUrl
} from "../../modules";
import {
  ControllerType,
  ProductDetailsResponseType,
  ProductType
} from "../../utils/types";
import {
  defaultErrorMessage,
  MAX_RETURN_ITEM_COUNT
} from "../../utils/variables";

const getProductController: ControllerType = async (req, res) => {
  const { query } = req;
  let { page, type, max } = query;

  if (!page) {
    page = `1`;
  }

  if (((type as ProductType) !== "log" && (type as ProductType)) !== "gift") {
    type = undefined;
  }

  if (!max || isNaN(parseInt(max?.toString()))) {
    max = MAX_RETURN_ITEM_COUNT?.toString();
  }

  try {
    const formattedPage = parseInt(page?.toString());
    const totalProducts = await ProductSchema.countDocuments(
      type ? { type } : { $or: [{ type: "log" }, { type: "gift" }] }
    );
    const maxPage = Math.ceil(totalProducts / parseInt(max?.toString())) || 1;
    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = parseInt(max?.toString()) * (formattedPage - 1);
    const fetchedProduct = await ProductSchema.find(
      type ? { type } : { $or: [{ type: "log" }, { type: "gift" }] }
    )
      .skip(skip)
      .limit(parseInt(max?.toString()))
      .exec();

    const formattedProduct: ProductDetailsResponseType[] = fetchedProduct.map(
      ({ name, type, quantity, amount, image, description, id }) => ({
        name,
        type,
        quantity,
        amount,
        image,
        description,
        id
      })
    );
    const canShowPreviousLink = formattedPage > 1;
    const canShowNextLink = formattedPage < maxPage;

    res.status(200).json(
      constructSuccessResponseBody(
        formattedProduct,
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

export default getProductController;
