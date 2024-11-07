import { ValidationError } from "joi";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors
} from "../../modules";
import { AddressDetailsResponseType, ControllerType } from "../../utils/types";
import { addressBodySchema, AddressBodyType } from "./createaddress.controller";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
import AddressSchema from "../../models/AddressModel";

const updateAddressController: ControllerType = async (req, res) => {
  const { body, params } = req;

  const { fetchedUserDetails } = body as AddressBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Address ID must be specified!"));
  }

  const { error } = addressBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }
  try {
    const addressDetails = await AddressSchema.findById(id);
    if (!addressDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Address not found"));
    }

    if (addressDetails.userId !== fetchedUserDetails.id) {
      return res
        .status(403)
        .json(constructErrorResponseBody("Operation not allowed!"));
    }

    const { address, lat, lng } = body as AddressBodyType;
    const newAddressDetails = await AddressSchema.findByIdAndUpdate(
      id,
      {
        coordinates: {
          lat,
          lng
        },
        address,
        lastUpdatedAt: new Date(),
        $push: {
          updates: {
            $each: [
              {
                description: `Changed the address`,
                updatedAt: new Date()
              }
            ]
          }
        }
      },
      { new: true }
    );
    if (!newAddressDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst updating address"
          )
        );
    }
    const data: AddressDetailsResponseType = {
      address: newAddressDetails.address,
      coordinates: newAddressDetails.coordinates,
      id: newAddressDetails.id,
      createdAt: newAddressDetails.createdAt
    };
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

export default updateAddressController;
