import { model, Schema } from "mongoose";
import { LogDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";
import updateSchema from "./UpdateModel";

const logSchema = new Schema<LogDetailsType>({
  createdAt: {
    type: Date,
    default: new Date()
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.products,
    required: true,
    index: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.users,
    default: null,
    index: true
  },
  lastUpdatedAt: {
    type: Date,
    default: null
  },
  updates: {
    type: [updateSchema],
    default: []
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: databaseKeys.users,
    required: true,
    index: true
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
