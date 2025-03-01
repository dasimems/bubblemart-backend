import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { constructErrorResponseBody } from "../../modules";
import CartSchema from "../../models/CartModel";
import { defaultErrorMessage } from "../../utils/variables";
import { MongoError } from "mongodb";

const deleteCartItemController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Cart ID is required!"));
  }

  try {
    const cartDetails = await CartSchema.findById(id); /* .lean() */
    if (!cartDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Cart item not found!"));
    }

    if (
      cartDetails?.userId?.toString() !== fetchedUserDetails?.id?.toString()
    ) {
      return res.status(403).json(constructErrorResponseBody("Not allowed!"));
    }

    await CartSchema.findByIdAndDelete(id);
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

export default deleteCartItemController;
