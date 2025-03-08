import { MongoError } from "mongodb";
import AddressSchema from "../../models/AddressModel";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import {
  AddressDetailsResponseType,
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";

const getAddressDetailsController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Address ID must be specified!"));
  }

  try {
    const addressDetails = await AddressSchema.findById(id).lean();
    if (!addressDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Address not found"));
    }

    if (String(addressDetails.userId) !== String(fetchedUserDetails.id)) {
      return res
        .status(403)
        .json(constructErrorResponseBody("Operation not allowed!"));
    }

    const data: AddressDetailsResponseType = {
      address: addressDetails.address,
      coordinates: addressDetails.coordinates,
      id: addressDetails._id?.toString(),
      createdAt: addressDetails.createdAt
    };
    return res.status(201).json(constructSuccessResponseBody(data));
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

export default getAddressDetailsController;
