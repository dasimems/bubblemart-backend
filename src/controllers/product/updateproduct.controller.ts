import Joi, { ValidationError } from "joi";
import {
  AmountType,
  ControllerType,
  ProductDetailsResponseType
} from "../../utils/types";
import { AddProductBodyType, logBodySchema } from "./addproduct.controller";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors,
  generateAmount
} from "../../modules";
import ProductSchema from "../../models/ProductModel";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
import LogSchema from "../../models/LogsModel";
export type UpdateProductBodyType = Partial<Omit<AddProductBodyType, "type">>;
const addProductBodySchema = Joi.object<UpdateProductBodyType>({
  name: Joi.string().optional().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required"
  }),
  quantity: Joi.number().optional().messages({
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
  }),
  logs: Joi.array().when("type", {
    is: "log", // Only validate this when productType is 'log'
    then: Joi.array().items(logBodySchema).messages({
      "array.min":
        'At least one log is required when the product type is "log".'
    }), // Array should have at least one user object
    otherwise: Joi.array().empty() // If productType is not 'log', users can be an empty array
  })
}).unknown(true);

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

  try {
    const productDetails = await ProductSchema.findOne({ _id: id });

    if (!productDetails) {
      return res
        .status(404)
        .json(constructErrorResponseBody("Product not found"));
    }

    let updatedData: Omit<UpdateProductBodyType, "amount"> & {
      amount?: AmountType;
    } = {};

    const { name, description, image, quantity, amount, logs } =
      body as Partial<AddProductBodyType>;

    let totalLogCount = 0;

    const isLog = productDetails?.type === "log";

    if (isLog) {
      const availableLogsPromise = LogSchema.countDocuments({
        productId: id,
        $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }]
      });
      const saveLogsPromise = LogSchema.insertMany(
        (logs || []).map(({ email, password }) => ({
          email,
          password,
          createdBy: fetchedUserDetails?.id || "",
          productId: productDetails?.id
        }))
      );
      const [availableLogs, savedLogs] = await Promise.all([
        availableLogsPromise,
        saveLogsPromise
      ]);
      totalLogCount = availableLogs + savedLogs.filter((log) => !!log).length;
    }

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
        quantity: isLog ? totalLogCount : quantity
      };
    }
    if (amount) {
      updatedData = {
        ...updatedData,
        amount: generateAmount(amount)
      };
    }

    const updatedKeys = Object.keys(updatedData);

    if (updatedKeys.length === 0) {
      return res.status(200).json({ message: "No update made" });
    }
    const newProductDetails = await ProductSchema.findByIdAndUpdate(
      id,
      {
        ...updatedData,
        lastUpdatedAt: new Date(),
        $push: {
          updates: {
            $each: [
              {
                description: `Made an update to ${updatedKeys.join(", ")}`,
                updatedAt: new Date()
              }
            ]
          }
        }
      },
      { new: true }
    ).lean();
    if (!newProductDetails) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst updating product details"
          )
        );
    }
    const data: ProductDetailsResponseType = {
      amount: newProductDetails?.amount,
      description: newProductDetails?.description,
      id: newProductDetails?._id?.toString(),
      image: newProductDetails?.image,
      name: newProductDetails?.name,
      quantity: newProductDetails?.quantity,
      type: newProductDetails?.type,
      createdAt: newProductDetails?.createdAt
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

export default updateProductController;
