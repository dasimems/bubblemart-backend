import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import { ControllerType, ProductDetailsResponseType } from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import ProductSchema from "../../models/ProductModel";

const getProductDetails: ControllerType = async (req, res) => {
  const { params } = req;
  const { id: productId } = params || {};

  if (!productId) {
    return res.status(404).json(constructErrorResponseBody("ID not found"));
  }

  try {
    const productDetails = await ProductSchema.findById(
      productId
    ); /* .lean() */

    if (!productDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Product not found"));
    }

    const { amount, description, name, type, quantity, image, _id, createdAt } =
      productDetails;
    const data: ProductDetailsResponseType = {
      amount,
      description,
      name,
      type,
      quantity,
      image,
      id: _id?.toString(),
      createdAt
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

export default getProductDetails;
