import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import { ControllerType, ProductDetailsResponseType } from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import ProductSchema from "../../models/ProductModel";
import CartSchema from "../../models/CartModel";

const getProductDetails: ControllerType = async (req, res) => {
  const { params, query } = req;
  const { id: productId } = params || {};

  const { isAdmin } = query;

  if (!productId) {
    return res.status(404).json(constructErrorResponseBody("ID not found"));
  }

  try {
    const productDetails = await ProductSchema.findById(productId).lean();

    let totalSales: number | null = null;

    if (!productDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Product not found"));
    }

    if (isAdmin) {
      totalSales = await CartSchema.countDocuments({
        "productDetails.id": productId,
        paidAt: { $exists: true }
      });
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
      createdAt,
      totalSales
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
