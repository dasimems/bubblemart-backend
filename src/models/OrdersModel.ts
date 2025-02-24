import { model, Schema } from "mongoose";
import { ContactInformationType, OrderDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";

const contactInformationSchema = new Schema<ContactInformationType>(
  {
    senderName: {
      type: String,
      required: true
    },
    receiverName: {
      type: String,
      required: true
    },
    receiverAddress: {
      type: String,
      required: true
    },
    receiverPhoneNumber: {
      type: String,
      required: true
    },
    shortNote: {
      type: String,
      default: null
    },
    longitude: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= -180 && v <= 180;
        },
        message: (props) => `${props.value} is not a valid longitude!`
      }
    },
    latitude: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= -90 && v <= 90;
        },
        message: (props) => `${props.value} is not a valid latitude!`
      }
    }
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDetailsType>({
  createdAt: {
    default: new Date(),
    type: Date
  },
  deliveredAt: {
    default: new Date(),
    type: Date
  },
  lastUpdatedAt: {
    default: null,
    type: Date
  },
  paidAt: {
    default: null,
    type: Date
  },
  paymentReference: {
    type: String,
    default: null,
    index: true
  },
  refundedAt: {
    default: null,
    type: Date
  },
  status: {
    type: String,
    default: "PENDING",
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: databaseKeys.users,
    index: true
  },
  paymentInitiatedAt: {
    default: null,
    type: Date
  },
  contactInformation: {
    type: contactInformationSchema,
    default: null
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
      required: true,
      index: true
    }
  ]
});

const OrderSchema = model(databaseKeys.orders, orderSchema);

export default OrderSchema;
