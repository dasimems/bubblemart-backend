import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  generateAmount
} from "../../modules";
import {
  AuthenticationDestructuredType,
  CartResponseType,
  ControllerType,
  ProductDetailsResponseType,
  ProductDetailsType
} from "../../utils/types";
import { databaseKeys, defaultErrorMessage } from "../../utils/variables";
import CartSchema from "../../models/CartModel";
import { Schema } from "mongoose";

const getCartItemsController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  try {
    const fetchCartPromise = CartSchema.find({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }]
    })
      .populate<ProductDetailsType>({
        path: "productDetails.id",
        model: databaseKeys.products, // Replace 'Product' with your actual Product model name
        select: "-__v", // Exclude unnecessary fields if needed
        options: {
          strictPopulate: false // Ensures no errors if the product doesn't exist
        }
      })
      .lean();
    const availableGiftCountPromise = CartSchema.countDocuments({
      userId: fetchedUserDetails.id,
      $or: [{ orderId: { $exists: false } }, { orderId: null }],
      "productDetails.type": "gift" // Check if order is not null
    });
    const [cartDetails, availableGiftCount] = await Promise.all([
      fetchCartPromise,
      availableGiftCountPromise
    ]);

    const cartItemsWithValidProduct = cartDetails?.filter(
      (details) => !!details?.productDetails?.id
    );
    const cartItemsWithInvalidProduct = cartDetails?.filter(
      (details) => !details?.productDetails?.id
    );

    Promise.all(
      cartItemsWithInvalidProduct.map((details) =>
        CartSchema.findOneAndDelete(details._id)
      )
    );

    const carts = cartItemsWithValidProduct?.map((details) => ({
      id: details?._id?.toString(),
      productDetails: {
        ...details?.productDetails,
        id: (
          details?.productDetails?.id as unknown as ProductDetailsResponseType
        )?.id as unknown as Schema.Types.ObjectId
      },
      quantity: details?.quantity,
      totalPrice: generateAmount(
        (details?.quantity || 0) * (details?.productDetails?.amount?.whole || 0)
      )
    }));
    const data: CartResponseType = {
      carts,
      isAddressNeeded: availableGiftCount > 0
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

export default getCartItemsController;
