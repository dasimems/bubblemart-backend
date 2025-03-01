import { MongoAPIError } from "mongodb";
import {
  calculateTokenExpirationDate,
  compareHashedPassword,
  constructErrorResponseBody,
  constructSuccessResponseBody,
  encryptToken,
  getIpAddress
} from "../../modules";
import { ControllerType, UserDetailsResponseType } from "../../utils/types";
import dotenv from "dotenv";
import UserModel from "../../models/UserModel";
import { cookieKeys, defaultErrorMessage } from "../../utils/variables";
dotenv.config();

const { env } = process;
const { ENVIRONMENT } = env || {};

export type LoginBodyType = {
  email: string;
  password: string;
};

export const loginController: ControllerType = async (req, res) => {
  const { body } = req;
  const { email: bodyEmail, password } = (body || {}) as LoginBodyType;
  const ipAddress = getIpAddress(req);

  if (!ipAddress) {
    return res
      .status(500)
      .json(constructErrorResponseBody("Unable to determine user!"));
  }

  if (!bodyEmail || !password) {
    return res
      .status(400)
      .json(
        constructErrorResponseBody(
          "Please provide both your email and password!"
        )
      );
  }

  const email = bodyEmail?.toLowerCase();

  try {
    const user = await UserModel.findOne({ email }); /* .lean() */
    if (!user) {
      return res
        .status(401)
        .json(constructErrorResponseBody("Wrong Credentials!"));
    }
    const {
      password: userPassword,
      _id,
      avatar,
      updatedAt,
      createdAt,
      role,
      name
    } = user;
    const isCorrectCredentials = await compareHashedPassword(
      password,
      userPassword
    );
    if (!isCorrectCredentials) {
      return res
        .status(401)
        .json(constructErrorResponseBody("Wrong Credentials!"));
    }
    const token = encryptToken({
      ipAddress,
      createdAt: new Date(),
      expiredAt: calculateTokenExpirationDate(),
      id: _id?.toString(),
      role: role || "USER"
    });

    if (!token) {
      return res
        .status(500)
        .json(
          constructErrorResponseBody("System Error! Token generation failed")
        );
    }
    const data: UserDetailsResponseType = {
      avatar,
      createdAt,
      email,
      id: _id?.toString(),
      name,
      role,
      updatedAt
    };

    return res
      .status(200)
      .cookie(cookieKeys.auth, token, {
        expires: calculateTokenExpirationDate(),
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .json({
        auth: {
          token,
          type: "Bearer"
        },
        ...constructSuccessResponseBody(data)
      });
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
