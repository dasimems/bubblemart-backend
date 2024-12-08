import { constructErrorResponseBody } from "../../modules";
import dotenv from "dotenv";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { cookieKeys } from "../../utils/variables";
dotenv.config();

const { env } = process;
const { ENVIRONMENT } = env || {};

const logoutController: ControllerType = (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  return res
    .clearCookie(cookieKeys.auth, {
      secure: ENVIRONMENT?.toLowerCase() === "production"
    })
    .status(204);
};

export default logoutController;
