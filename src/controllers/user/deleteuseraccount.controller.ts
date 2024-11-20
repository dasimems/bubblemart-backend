import Joi, { ValidationError } from "joi";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import {
  compareHashedPassword,
  constructErrorResponseBody,
  formatJoiErrors
} from "../../modules";
import { MongoAPIError } from "mongodb";
import { cookieKeys, defaultErrorMessage } from "../../utils/variables";
import UserModel from "../../models/UserModel";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;
const { ENVIRONMENT } = env || {};

export type DeleteUserBodyType = {
  password: string;
} & Partial<AuthenticationDestructuredType>;

const schema = Joi.object<DeleteUserBodyType>({
  password: Joi.string().required().messages({
    "any.required": "Password is needed to perform this operation",
    "string.empty": "Your password is needed to perform this operation"
  })
});

const deleteUserController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as DeleteUserBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = schema.validate(body, { abortEarly: false });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  try {
    const { password } = body;
    const { password: userPassword, id } = fetchedUserDetails;

    const isCorrectCredentials = await compareHashedPassword(
      password,
      userPassword
    );

    if (!isCorrectCredentials) {
      res.status(401).json(constructErrorResponseBody("Authorization failed!"));
    }

    await UserModel.findByIdAndDelete(id);
    return res
      .clearCookie(cookieKeys.auth, {
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .status(204);
  } catch (error) {
    return res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as MongoAPIError)?.message ?? defaultErrorMessage
        )
      );
  }
};

export default deleteUserController;
