import Joi, { ValidationError } from "joi";
import {
  AuthenticationDestructuredType,
  ControllerType,
  ProductDetailsResponseType,
  ProductType
} from "../../utils/types";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  createProduct,
  formatJoiErrors
} from "../../modules";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
import ProductSchema from "../../models/ProductModel";

export type AddProductBodyType = {
  name: string;
  type: ProductType;
  quantity: number;
  amount: number;
  image: string;
  description: string;
} & Partial<AuthenticationDestructuredType>;

const addProductBodySchema = Joi.object<AddProductBodyType>({
  name: Joi.string().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required"
  }),
  quantity: Joi.number().greater(0).required().messages({
    "any.required": "The quantity field is required",
    "number.base": "The expected input is number",
    "number.greater": "Product quantity must be  at least 1"
  }),
  amount: Joi.number().greater(0).required().messages({
    "any.required": "Amount field is required",
    "number.base": "The expected amount is number",
    "number.greater": "Product amount must be  at least ₦1"
  }),
  image: Joi.string()
    .uri({ scheme: ["https"] })
    .required()
    .messages({
      "string.empty": "Please upload your image",
      "any.required": "You have to upload a image",
      "string.uri": "Invalid image detected"
    }),
  type: Joi.string().valid("log", "gift").required().messages({
    "string.empty": "Please provide the type of the product",
    "any.required": "Please provide the type of the product",
    "any.invalid": "The selected type must either be gift or log"
  }),
  description: Joi.string().max(500).required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
    "string.max": "The description must not be greater than 500 characters"
  })
});

const addProductController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AddProductBodyType;
  if (
    !fetchedUserDetails ||
    (fetchedUserDetails && fetchedUserDetails.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = addProductBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const { name, type, description, image, quantity, amount } =
      body as AddProductBodyType;
    const productDetails = await ProductSchema.create(
      createProduct(
        name,
        type,
        quantity,
        amount,
        image,
        description,
        fetchedUserDetails.id
      )
    );
    if (!productDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst creating product details"
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

export default addProductController;
