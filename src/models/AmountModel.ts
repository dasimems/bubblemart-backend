import { Schema } from "mongoose";
import { AmountType } from "../utils/types";

const amountSchema = new Schema<AmountType>(
  {
    amount: { type: Number, required: true },
    currency: {
      symbol: { type: String, required: true },
      name: { type: String, required: true }
    },
    whole: { type: Number, required: true },
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
  { _id: false }
);

export default amountSchema;
