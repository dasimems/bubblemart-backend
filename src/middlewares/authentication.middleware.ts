import { constructErrorResponseBody, decryptToken } from "../modules";
import { MiddleWareType } from "../utils/types";

export const authenticationMiddleware: MiddleWareType = (req, res, next) => {
  const fetchedToken: string = req.cookies.auth || req.headers.authorization;
  const ipAddress = req?.ip || req?.connection?.remoteAddress;

  if (!ipAddress) {
    return res
      .status(500)
      .json(constructErrorResponseBody("Unable locate IP!"));
  }

  if (!fetchedToken) {
    return res
      .sendStatus(401)
      .json(constructErrorResponseBody("Unauthenticated"));
  }
  const authToken = fetchedToken.replace("Bearer", "").replace(" ", "").trim();

  try {
    const content = decryptToken(authToken);

    if (!content || (content && content.ipAddress !== ipAddress)) {
      return res
        .sendStatus(401)
        .json(constructErrorResponseBody("Unauthenticated"));
    }
  } catch {
    return res
      .sendStatus(401)
      .json(constructErrorResponseBody("Unauthenticated"));
  }

  next();
};
