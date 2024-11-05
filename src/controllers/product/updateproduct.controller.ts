import Joi, { ValidationError } from "joi";
import { ControllerType, ProductDetailsResponseType } from "../../utils/types";
import { AddProductBodyType } from "./addproduct.controller";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors
} from "../../modules";
import ProductSchema from "../../models/ProductModel";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
export type UpdateProductBodyType = Partial<Omit<AddProductBodyType, "type">>;
const addProductBodySchema = Joi.object<UpdateProductBodyType>({
  name: Joi.string().optional().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required"
  }),
  quantity: Joi.number().greater(0).optional().messages({
    "any.required": "The quantity field is required",
    "number.base": "The expected input is number",
    "number.greater": "Product quantity must be  at least 1"
  }),
  amount: Joi.number().greater(0).optional().messages({
    "any.required": "Amount field is required",
    "number.base": "The expected amount is number",
    "number.greater": "Product amount must be  at least ₦1"
  }),
  image: Joi.string()
    .uri({ scheme: ["https"] })
    .optional()
    .messages({
      "string.empty": "Please upload your image",
      "any.required": "You have to upload a image",
      "string.uri": "Invalid image detected"
    }),
  description: Joi.string().max(500).optional().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
    "string.max": "The description must not be greater than 500 characters"
  })
});

const updateProductController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { fetchedUserDetails } = body as UpdateProductBodyType;
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

  const { error } = addProductBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  let updatedData: UpdateProductBodyType = {};

  const { name, description, image, quantity, amount } =
    body as Partial<AddProductBodyType>;

  if (name) {
    updatedData = {
      ...updatedData,
      name
    };
  }
  if (description) {
    updatedData = {
      ...updatedData,
      description
    };
  }
  if (image) {
    updatedData = {
      ...updatedData,
      image
    };
  }
  if (quantity) {
    updatedData = {
      ...updatedData,
      quantity
    };
  }
  if (amount) {
    updatedData = {
      ...updatedData,
      amount
    };
  }

  if (Object.keys(updatedData).length === 0) {
    return res.status(200).json({ message: "No update made" });
  }

  try {
    const productDetails = await ProductSchema.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );
    if (!productDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst updating product details"
          )
        );
    }
    const data: ProductDetailsResponseType = {
      amount: productDetails.amount,
      description: productDetails.description,
      id: productDetails.id,
      image: productDetails.image,
      name: productDetails.name,
      quantity: productDetails.quantity,
      type: productDetails.type
    };
    return res.send(201).json(constructSuccessResponseBody(data));
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

export default updateProductController;
