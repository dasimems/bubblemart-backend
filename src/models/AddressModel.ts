import { model, Schema } from "mongoose";
import { AddressDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";

const addressSchema = new Schema<AddressDetailsType>({
  address: {
    required: true,
    type: String
  },
  coordinates: {
    lng: {
      required: true,
      type: Number
    },
    lat: {
      required: true,
      type: Number
    }
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.users,
    required: true
  },
  lastUpdatedAt: {
    type: Date,
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
  ]
});

const AddressSchema = model(databaseKeys.address, addressSchema);

export default AddressSchema;
