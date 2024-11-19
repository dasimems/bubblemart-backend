import { ControllerType } from "../../utils/types";
import { constructErrorResponseBody } from "../../modules";
import CartSchema from "../../models/CartModel";
import { defaultErrorMessage } from "../../utils/variables";
import { MongoError } from "mongodb";

const deleteCartItemController: ControllerType = async (req, res) => {
  const { params } = req;

  const { id } = params || {};

  if (!id) {
    return res.status(400).json(constructErrorResponseBody("ID is required!"));
  }

  try {
    const cartDetails = await CartSchema.findById(id);
    if (!cartDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Cart item not found!"));
    }

    await CartSchema.findByIdAndDelete(id);
    return res.status(204);
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
