import { Schema } from "mongoose";
import { ChangesType } from "../utils/types";

const updateSchema = new Schema<ChangesType>(
  {
    description: {
      type: String
    },
    updatedAt: {
      type: Date
    }
  },
  { _id: false }
);

export default updateSchema;
