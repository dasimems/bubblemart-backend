import { model, Schema } from "mongoose";
import { OrderDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";

const orderSchema = new Schema<OrderDetailsType>({
  createdAt: {
    default: new Date(),
    type: Date
  },
  lastUpdatedAt: {
    default: null,
    type: Date
  },
  orderNo: {
    type: String,
    default: null
  },
  paidAt: {
    default: null,
    type: Date
  },
  paymentReference: {
    type: String,
    default: null
  },
  refundedAt: {
    default: null,
    type: Date
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users
  },
  paymentInitiatedAt: {
    default: null,
    type: Date
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
  cartItems: [
    {
      type: Schema.Types.ObjectId,
      ref: databaseKeys.carts,
      required: true
    }
  ]
});

const OrderSchema = model(databaseKeys.orders, orderSchema);

export default OrderSchema;
