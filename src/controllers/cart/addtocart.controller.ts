import Joi, { ValidationError } from "joi";
import {
  AuthenticationDestructuredType,
  CartDetailsResponseType,
  CartProductDetails,
  ControllerType
} from "../../utils/types";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors,
  generateAmount
} from "../../modules";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";
import ProductSchema from "../../models/ProductModel";
import CartSchema from "../../models/CartModel";

export type AddToCartBodyType = {
  productId: string;
  quantity: number;
} & Partial<AuthenticationDestructuredType>;

export const addToCartSchema = Joi.object<AddToCartBodyType>({
  productId: Joi.string().required().messages({
    "string.empty": "Product ID needed for this operation",
    "any.required": "Product ID missing"
  }),
  quantity: Joi.number().required().messages({
    "number.base": "Expected input is a number",
    "any.required": "Please provide your quantity"
  })
}).unknown(true);

const addToCartController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AddToCartBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = addToCartSchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const { productId, quantity } = body as AddToCartBodyType;
    const [productDetails, cartDetails] = await Promise.all([
      ProductSchema.findById(productId).lean(),
      CartSchema.findOne({
        "productDetails.id": productId,
        userId: fetchedUserDetails?.id,
        $or: [{ orderId: { $exists: false } }, { orderId: null }]
      })
    ]);

    if (!productDetails) {
      if (cartDetails) {
        await CartSchema.deleteOne({ _id: cartDetails?.id });
      }
      return res
        .status(404)
        .json(constructErrorResponseBody("Product doesn't exist any longer!"));
    }

    if (cartDetails) {
      if (productDetails.quantity < cartDetails.quantity + quantity) {
        return res
          .status(416)
          .json(constructErrorResponseBody("Product quantity Out of bound!"));
      }
      cartDetails.quantity += quantity;
      cartDetails.updates = [
        ...cartDetails.updates,
        {
          description: `Added ${quantity} more product to the cart`,
          updatedAt: new Date()
        }
      ];
      await cartDetails.save();
      const details = await CartSchema.findOne({ _id: cartDetails.id }).lean();
      if (!details) {
        return res
          .status(404)
          .json(constructErrorResponseBody("Cart doesn't exist any longer!"));
      }
      const data: CartDetailsResponseType = {
        id: details?._id?.toString(),
        productDetails:
          details?.productDetails as unknown as CartProductDetails,
        quantity: details?.quantity,
        totalPrice: generateAmount(
          (details?.quantity || 0) *
            (details?.productDetails?.amount?.whole || 0)
        ),
        createdAt: details?.createdAt,
        isAvailable: details.quantity <= productDetails.quantity
      };
      return res.status(200).json(constructSuccessResponseBody(data));
    }
    if (productDetails.quantity < quantity) {
      return res
        .status(416)
        .json(constructErrorResponseBody("Product quantity Out of bound!"));
    }
    const details = await CartSchema.create({
      userId: fetchedUserDetails?.id,
      quantity,
      productDetails: {
        id: productDetails?._id?.toString(),
        name: productDetails?.name,
        image: productDetails?.image,
        amount: productDetails?.amount,
        description: productDetails?.description,
        type: productDetails?.type
      }
    });

    const data: CartDetailsResponseType = {
      id: details?.id,
      productDetails: details?.productDetails,
      quantity: details?.quantity,
      totalPrice: generateAmount(
        (details?.quantity || 0) * (details?.productDetails?.amount?.whole || 0)
      ),
      createdAt: details?.createdAt,
      isAvailable: details.quantity <= productDetails.quantity
    };
    return res.status(201).json(constructSuccessResponseBody(data));
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

export default addToCartController;
