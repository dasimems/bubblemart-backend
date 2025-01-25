import { MongoError } from "mongodb";
import { constructErrorResponseBody } from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";

const clearCartController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  try {
    await CartSchema.deleteMany({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }]
    });
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

export default clearCartController;
