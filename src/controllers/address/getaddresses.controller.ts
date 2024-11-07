import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  getBaseUrl
} from "../../modules";
import {
  AddressDetailsResponseType,
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import AddressSchema from "../../models/AddressModel";

const MAX_RETURN_ADDRESS_COUNT = 20;

const getAddressesController: ControllerType = async (req, res) => {
  const { body, query } = req;

  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  let { page } = query;

  if (!page) {
    page = `1`;
  }

  try {
    const formattedPage = parseInt(page?.toString());
    const totalProducts = await AddressSchema.countDocuments({
      userId: fetchedUserDetails.id
    });
    const maxPage = Math.ceil(totalProducts / MAX_RETURN_ADDRESS_COUNT) || 1;
    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = MAX_RETURN_ADDRESS_COUNT * (formattedPage - 1);
    const fetchedProduct = await AddressSchema.find({
      userId: fetchedUserDetails.id
    })
      .skip(skip)
      .limit(MAX_RETURN_ADDRESS_COUNT)
      .exec();

    const formattedAddressList: AddressDetailsResponseType[] =
      fetchedProduct.map(({ id, coordinates, address, createdAt }) => ({
        id,
        coordinates,
        address,
        createdAt
      }));
    const canShowPreviousLink = formattedPage > 1;
    const canShowNextLink = formattedPage < maxPage;

    res.status(200).json(
      constructSuccessResponseBody(
        formattedAddressList,
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

export default getAddressesController;
