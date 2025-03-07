import { model, Schema } from "mongoose";
import { databaseKeys } from "../utils/variables";
import { ProductDetailsType } from "../utils/types";
import amountSchema from "./AmountModel";
import updateSchema from "./UpdateModel";

const productSchema = new Schema<ProductDetailsType>({
  amount: {
    type: amountSchema,
    required: true
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
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  updates: {
    type: [updateSchema],
    default: []
  },
  lastUpdatedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users,
    index: true
  }
});

const ProductSchema = model(databaseKeys.products, productSchema);

export default ProductSchema;
