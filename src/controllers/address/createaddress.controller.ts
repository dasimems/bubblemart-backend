import Joi, { ValidationError } from "joi";
import {
  AddressDetailsResponseType,
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors
} from "../../modules";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
import AddressSchema from "../../models/AddressModel";

export type AddressBodyType = {
  address: string;
  lng: number;
  lat: number;
} & Partial<AuthenticationDestructuredType>;

export const addressBodySchema = Joi.object<AddressBodyType>({
  address: Joi.string().required().messages({
    "string.empty": "Please provide your address",
    "any.required": "Please provide your address"
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    "any.required": "Please provide your longitude",
    "number.base": "Please provide a valid longitude",
    "number.min": "Please provide a valid longitude",
    "number.max": "Please provide a valid longitude"
  }),
  lat: Joi.number().min(-90).max(90).required().messages({
    "any.required": "Please provide your latitude",
    "number.base": "Please provide a valid latitude",
    "number.min": "Please provide a valid latitude",
    "number.max": "Please provide a valid latitude"
  })
});

const createAddressController: ControllerType = async (req, res) => {
  const { body } = req;

  const { fetchedUserDetails } = body as AddressBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = addressBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const { address, lat, lng } = body as AddressBodyType;

    const availableAddress = await AddressSchema.find({
      userId: fetchedUserDetails.id,
      "coordinates.lng": lng,
      "coordinates.lat": lat
    });
    if (availableAddress.length > 0) {
      const [selectedAddress] = availableAddress;
      const data: AddressDetailsResponseType = {
        address: selectedAddress.address,
        coordinates: selectedAddress.coordinates,
        id: selectedAddress.id,
        createdAt: selectedAddress.createdAt
      };
      return res.status(200).json(constructSuccessResponseBody(data));
    }

    const addressDetails = await AddressSchema.create({
      address,
      coordinates: {
        lat,
        lng
      },
      userId: fetchedUserDetails?.id
    });

    if (!addressDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst adding address"
          )
        );
    }
    const data: AddressDetailsResponseType = {
      address: addressDetails.address,
      coordinates: addressDetails.coordinates,
      id: addressDetails.id,
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

export default createAddressController;
