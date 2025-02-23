import { MongoError } from "mongodb";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody,
  getBaseUrl
} from "../../modules";
import { ControllerType, UserDetailsResponseType } from "../../utils/types";
import {
  defaultErrorMessage,
  MAX_RETURN_ITEM_COUNT
} from "../../utils/variables";
import UserModel from "../../models/UserModel";

const getUserListController: ControllerType = async (req, res) => {
  const { body, query } = req;
  const { fetchedUserDetails } = body;

  if (!fetchedUserDetails || fetchedUserDetails?.role !== "ADMIN") {
    {
      return res.status(403).json({ message: "Not allowed!" });
    }
  }
  let { page } = query;

  if (!page) {
    page = `1`;
  }
  try {
    const formattedPage = parseInt(page?.toString());
    const totalUsers = await UserModel.countDocuments();
    const maxPage = Math.ceil(totalUsers / MAX_RETURN_ITEM_COUNT) || 1;

    const host = req.hostname || req.get("host") || "";
    const route = req.path;
    const link = `${req.protocol}://${host}${req.originalUrl}`;

    if (isNaN(formattedPage) || formattedPage > maxPage) {
      return res.status(416).json(constructErrorResponseBody("Out of bound!"));
    }
    const skip = (formattedPage - 1) * MAX_RETURN_ITEM_COUNT;

    const canShowPreviousLink = formattedPage > 1;
    const canShowNextLink = formattedPage < maxPage;
    const users = await UserModel.find()
      .skip(skip)
      .limit(MAX_RETURN_ITEM_COUNT)
      .select("-__v");
    const userData: UserDetailsResponseType[] = users.map((userDetails) => ({
      avatar: userDetails?.avatar,
      createdAt: userDetails?.createdAt,
      email: userDetails?.email,
      id: userDetails?.id?.toString() as string,
      name: userDetails?.name,
      role: userDetails?.role,
      updatedAt: userDetails?.updatedAt
    }));
    return res.status(200).json(
      constructSuccessResponseBody(
        userData,
        totalUsers,
        maxPage,
        formattedPage,
        canShowPreviousLink
          ? {
              host,
              link,
              route,
              baseUrl: getBaseUrl(req.protocol, host),
              commonUrl: `${route.replace("/v1", "")}?page=${formattedPage - 1}`
            }
          : undefined,
        canShowNextLink
          ? {
              host,
              link,
              route,
              baseUrl: getBaseUrl(req.protocol, host),
              commonUrl: `${route.replace("/v1", "")}?page=${formattedPage + 1}`
            }
          : undefined
      )
    );
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

export default getUserListController;
