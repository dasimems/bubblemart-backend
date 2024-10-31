import { MongoAPIError } from "mongodb";
import {
  calculateTokenExpirationDate,
  compareHashedPassword,
  constructErrorResponseBody,
  constructSuccessResponseBody,
  encryptToken
} from "../../modules";
import { ControllerType, UserDetailsResponseType } from "../../utils/types";
import dotenv from "dotenv";
import UserModel from "../../models/UserModel";
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
  const ipAddress = req?.ip || req?.connection?.remoteAddress;

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
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json(constructErrorResponseBody("Wrong Credentials!"));
    }
    const {
      password: userPassword,
      id,
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
        .status(400)
        .json(constructErrorResponseBody("Wrong Credentials!"));
    }
    const token = encryptToken({
      ipAddress,
      createdAt: new Date(),
      expiredAt: calculateTokenExpirationDate(),
      id: id,
      role: "USER"
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
      id,
      name,
      role,
      updatedAt
    };

    return res
      .status(200)
      .cookie("auth", token, {
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
          (error as MongoAPIError)?.message ??
            "System Error! Unknown error occurred"
        )
      );
  }
};
