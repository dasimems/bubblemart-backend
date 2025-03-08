import { MongoError } from "mongodb";
import AddressSchema from "../../models/AddressModel";
import { constructErrorResponseBody } from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";

const deleteAddressController: ControllerType = async (req, res) => {
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
    const addressDetails = await AddressSchema.findById(id).select("userId");
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

    await AddressSchema.findByIdAndDelete(id);
    return res.status(204).end();
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

export default deleteAddressController;
