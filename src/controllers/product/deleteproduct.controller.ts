import { MongoError } from "mongodb";
import ProductSchema from "../../models/ProductModel";
import { constructErrorResponseBody } from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
const deleteProductController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (
    !fetchedUserDetails ||
    (fetchedUserDetails && fetchedUserDetails.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { id } = params || {};

  if (!id) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Product ID must be specified!"));
  }
  try {
    const productDetails = await ProductSchema.exists({ _id: id });

    if (!productDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Product not found"));
    }

    await ProductSchema.findByIdAndDelete(id) /* .lean() */;
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

export default deleteProductController;
