import { model, Schema } from "mongoose";
import { LogDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";

const logSchema = new Schema<LogDetailsType>({
  createdAt: {
    type: Date,
    default: new Date()
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.products,
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
  ],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.users,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const LogSchema = model(databaseKeys.log, logSchema);

export default LogSchema;
