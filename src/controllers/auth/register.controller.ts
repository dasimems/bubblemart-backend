import Joi, { ValidationError } from "joi";
import { ControllerType, UserDetailsResponseType } from "../../utils/types";
import { nameRegExp, passwordRegExp } from "../../utils/regex";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  createUser,
  formatJoiErrors,
  hashPassword
} from "../../modules";
import { MongoError } from "mongodb";
import UserModel from "../../models/UserModel";
import { defaultErrorMessage } from "../../utils/variables";

export type RegisterBodyType = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

const schema = Joi.object<RegisterBodyType>({
  email: Joi.string().email({ minDomainSegments: 1 }).required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required"
  }),
  name: Joi.string().pattern(nameRegExp).required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
    "string.pattern.base": "Please provide a valid name"
  }),
  password: Joi.string().min(8).pattern(passwordRegExp).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.pattern.base":
      "Password must contain at least a lowercase character, uppercase character, number and special character",
    "string.min": "Your password must not be less than 8 characters"
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Please repeat your password",
    "any.required": "Please repeat your password",
    "any.only": "Your repeated password doesn't match"
  })
}).unknown(true);

export const registerController: ControllerType = async (req, res) => {
  const { body } = req;

  try {
    const { error } = schema.validate(body, { abortEarly: false });
    const errors = formatJoiErrors(error as ValidationError);
    if (errors) {
      return res
        .status(400)
        .json(constructErrorResponseBody("Invalid values detected!", errors));
    }
    const { email, password, name } = body as RegisterBodyType;
    const user = await UserModel.exists({ email });

    if (user) {
      return res
        .status(409)
        .json(constructErrorResponseBody("User already exist! Please login"));
    }
    const hashedPassword = await hashPassword(password);
    const userDetails = createUser(email, name, hashedPassword);
    const newUser = await UserModel.create(userDetails);
    if (!newUser) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody(
            "Unknown error occurred when creating users"
          )
        );
    }
    const { id, avatar, updatedAt, createdAt, role } = newUser;
    const data: UserDetailsResponseType = {
      avatar,
      createdAt,
      email,
      id,
      name,
      role,
      updatedAt
    };
    return res.status(201).json(constructSuccessResponseBody(data));
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
