import { MongoError } from "mongodb";
import ProductSchema from "../../models/ProductModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  getBaseUrl
} from "../../modules";
import { ControllerType, ProductDetailsResponseType } from "../../utils/types";
import {
  defaultErrorMessage,
  MAX_RETURN_ITEM_COUNT
} from "../../utils/variables";

const getProductController: ControllerType = async (req, res) => {
  const { query } = req;
  let { page } = query;

  if (!page) {
    page = `1`;
  }

  try {
    const formattedPage = parseInt(page?.toString());
    const totalProducts = await ProductSchema.countDocuments();
    const maxPage = Math.ceil(totalProducts / MAX_RETURN_ITEM_COUNT) || 1;
    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = MAX_RETURN_ITEM_COUNT * (formattedPage - 1);
    const fetchedProduct = await ProductSchema.find()
      .skip(skip)
      .limit(MAX_RETURN_ITEM_COUNT)
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
    console.log(error);
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
