import { model, Schema } from "mongoose";
import { CartDetailsType, CartProductDetails } from "../utils/types";
import { databaseKeys } from "../utils/variables";
import amountSchema from "./AmountModel";
import updateSchema from "./UpdateModel";

export const cartProductSchema = new Schema<CartProductDetails>(
  {
    id: {
      type: Schema.Types.ObjectId,
      ref: databaseKeys.products,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    amount: {
      type: amountSchema,
      required: true
    }
  },
  { _id: false }
);

const cartSchema = new Schema<CartDetailsType>({
  createdAt: {
    default: new Date(),
    type: Date
  },
  lastUpdatedAt: {
    default: null,
    type: Date
  },
  productDetails: {
    type: cartProductSchema,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users,
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.orders,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  updates: {
    type: [updateSchema],
    default: []
  },
  paidAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  }
});

cartSchema.index({ "productDetails.id": 1, "productDetails.type": 1 });

const CartSchema = model(databaseKeys.carts, cartSchema);

export default CartSchema;
