import { model, Schema } from "mongoose";
import { UserDetailsType } from "../utils/types";
import { databaseKeys } from "../utils/variables";

const userSchema = new Schema<UserDetailsType>(
  {
    name: {
      type: String,
      required: true
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
      lowercase: true
    },
    role: {
      type: String,
      default: "USER"
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
  }
);

const UserModel = model(databaseKeys.users, userSchema);

export default UserModel;
