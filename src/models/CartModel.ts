import { model, Schema } from "mongoose";
import { CartDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";
import amountSchema from "./AmountModel";

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
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.orders
  },
  quantity: {
    type: Number,
    required: true
  },
  updates: [
    {
      description: {
        type: String
      },
      updatedAt: {
        type: Date
      }
    }
  ],
  paidAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  }
});

const CartSchema = model(databaseKeys.carts, cartSchema);

export default CartSchema;
