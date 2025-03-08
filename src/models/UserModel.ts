import { model, Schema } from "mongoose";
import { UserDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";
import updateSchema from "./UpdateModel";

const userSchema = new Schema<UserDetailsType>({
  name: {
    type: String,
    required: true,
    index: true
  },
  avatar: {
    type: String,
    default: null,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  updatedAt: {
    type: Date,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  role: {
    type: String,
    default: "USER",
    index: true
  },
  updates: {
    type: [updateSchema],
    default: []
  }
});

const UserModel = model(databaseKeys.users, userSchema);

export default UserModel;
