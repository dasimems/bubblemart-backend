import { model, Schema } from "mongoose";
import { databaseKeys } from "../utils/variables";
import { ProductDetailsType } from "../utils/types";

const productSchema = new Schema<ProductDetailsType>({
  amount: {
    amount: { type: Number, required: true },
    currency: {
      symbol: { type: String, required: true },
      name: { type: String, required: true }
    },
    formatted: {
      withoutCurrency: {
        type: String,
        required: true
      },
      withCurrency: {
        type: String,
        required: true
      }
    }
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  quantity: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
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
  lastUpdatedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users
  }
});

const ProductSchema = model(databaseKeys.products, productSchema);

export default ProductSchema;
