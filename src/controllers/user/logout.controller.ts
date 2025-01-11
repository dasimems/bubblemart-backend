import { constructErrorResponseBody } from "../../modules";
import dotenv from "dotenv";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { cookieKeys, defaultErrorMessage } from "../../utils/variables";
import { MongoError } from "mongodb";
dotenv.config();

const { env } = process;
const { ENVIRONMENT } = env || {};

const logoutController: ControllerType = (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;

  try {
    if (!fetchedUserDetails) {
      return res.status(403).json(constructErrorResponseBody("Not allowed!"));
    }
    return res
      .clearCookie(cookieKeys.auth, {
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .status(200)
      .json({ message: "Logged out successfully" });
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

export default logoutController;
