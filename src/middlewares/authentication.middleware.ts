import UserModel from "../models/UserModel";
import { constructErrorResponseBody, decryptToken } from "../modules";
import { MiddleWareType } from "../utils/types";
import { cookieKeys } from "../utils/variables";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;
const { ENVIRONMENT } = env || {};

export const authenticationMiddleware: MiddleWareType = async (
  req,
  res,
  next
) => {
  const fetchedToken: string = req.cookies.auth || req.headers.authorization;
  const ipAddress = req?.ip || req?.connection?.remoteAddress;

  console.log("X-Forwarded-For:", req.headers["x-forwarded-for"]);
  console.log("Resolved IP Address:", req.ip);

  if (!ipAddress) {
    return res
      .clearCookie(cookieKeys.auth, {
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .status(500)
      .json(constructErrorResponseBody("Unable locate IP!"));
  }

  if (!fetchedToken) {
    console.log("Couldn't fetch token!");
    return res
      .clearCookie(cookieKeys.auth, {
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .status(401)
      .json(constructErrorResponseBody("Unauthenticated"));
  }
  const authToken = fetchedToken.replace("Bearer", "").replace(" ", "").trim();

  try {
    const content = decryptToken(authToken);

    if (!content || (content && content.ipAddress !== ipAddress)) {
      console.log("Couldn't fetch content!");

      console.log("Ip address don't match!", content?.ipAddress, ipAddress);
      return res
        .clearCookie(cookieKeys.auth, {
          secure: ENVIRONMENT?.toLowerCase() === "production"
        })
        .status(401)
        .json(constructErrorResponseBody("Unauthenticated"));
    }

    const { expiredAt, role, id } = content;

    const todaysDate = new Date().getTime();
    const expiryDate = new Date(expiredAt).getTime();

    if (todaysDate >= expiryDate) {
      console.log("Expiry date issue!");
      return res
        .clearCookie(cookieKeys.auth, {
          secure: ENVIRONMENT?.toLowerCase() === "production"
        })
        .status(401)
        .json(constructErrorResponseBody("Unauthenticated"));
    }
    const userDetails = await UserModel.findById(id);
    if (!userDetails) {
      console.log("Couldn't fetch user!");
      return res
        .clearCookie(cookieKeys.auth, {
          secure: ENVIRONMENT?.toLowerCase() === "production"
        })
        .status(403)
        .json(constructErrorResponseBody("Unknown response"));
    }
    req.body.userTokenRole = role;
    req.body.userTokenId = id;
    req.body.fetchedUserDetails = userDetails;
  } catch (error) {
    console.log("Other problem authenticating!");

    console.log(error);
    return res
      .clearCookie(cookieKeys.auth, {
        secure: ENVIRONMENT?.toLowerCase() === "production"
      })
      .status(401)
      .json(constructErrorResponseBody("Unauthenticated"));
  }

  next();
};
