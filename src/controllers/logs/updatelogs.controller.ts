import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  formatJoiErrors
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType,
  LogDetailsResponseType,
  LogType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import Joi, { ValidationError } from "joi";
import LogSchema from "../../models/LogsModel";
import { ObjectId } from "mongoose";

type LogBodyType = LogType & AuthenticationDestructuredType;

const logBodySchema = Joi.object<LogBodyType>({
  email: Joi.string().optional().messages({
    "string.empty": "Email/Username is required",
    "any.required": "Email/Username is required"
  }), // Validate email format
  password: Joi.string().min(6).optional().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required"
  }) // Validate password (minimum 6 characters)
}).unknown(true);

const updateLogController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { productId } = params;

  const { fetchedUserDetails } = body as LogBodyType;
  if (
    !fetchedUserDetails ||
    (productId && fetchedUserDetails?.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  const { error } = logBodySchema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const logDetails = await LogSchema.exists({ _id: productId });

    if (!logDetails) {
      return res.status(404).json(constructErrorResponseBody("Log not found"));
    }

    let updatedData: Partial<LogBodyType> = {};
    const { email, password } = body as LogBodyType;

    if (email) {
      updatedData = {
        ...updatedData,
        email
      };
    }
    if (password) {
      updatedData = {
        ...updatedData,
        password
      };
    }
    const updatedKeys = Object.keys(updatedData);

    if (updatedKeys.length === 0) {
      return res.status(200).json({ message: "No update made" });
    }

    const newLog = await LogSchema.findByIdAndUpdate(
      productId,
      {
        ...updatedData,
        lastUpdatedAt: new Date(),
        $push: {
          updates: {
            $each: [
              {
                description: `Made an update to ${updatedKeys.join(", ")}`,
                updatedAt: new Date()
              }
            ]
          }
        }
      },
      { new: true }
    ).lean();
    if (!newLog) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred whilst updating log details"
          )
        );
    }
    const data: LogDetailsResponseType = {
      email: newLog.email,
      password: newLog.password,
      id: newLog._id?.toString(),
      assignedTo: newLog.assignedTo as unknown as ObjectId
    };
    return res.status(200).json(constructSuccessResponseBody(data));
  } catch (error) {
    return res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as MongoError)?.message || defaultErrorMessage
        )
      );
  }
};

export default updateLogController;
