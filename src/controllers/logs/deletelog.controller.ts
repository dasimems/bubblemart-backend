import { MongoError } from "mongodb";
import { constructErrorResponseBody } from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";
import LogSchema from "../../models/LogsModel";

const deleteLogController: ControllerType = async (req, res) => {
  const { body, params } = req;
  const { productId } = params;

  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (
    !fetchedUserDetails ||
    (productId && fetchedUserDetails?.role !== "ADMIN")
  ) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  try {
    const logDetails = await LogSchema.exists({ _id: productId });

    if (!logDetails) {
      return res.status(404).json(constructErrorResponseBody("Log not found"));
    }

    await LogSchema.deleteOne({ _id: productId });
    return res.status(204).end();
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

export default deleteLogController;
