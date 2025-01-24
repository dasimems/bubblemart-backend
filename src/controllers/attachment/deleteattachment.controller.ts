import Joi, { ValidationError } from "joi";
import { constructErrorResponseBody, formatJoiErrors } from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import cloudinary from "../../utils/cloudinary";
import { MongoError } from "mongodb";
import { defaultErrorMessage } from "../../utils/variables";

type DeleteAttachmentBodyType = {
  path: string;
} & Partial<AuthenticationDestructuredType>;

const deleteAttachmentBodySchema = Joi.object<DeleteAttachmentBodyType>({
  path: Joi.string()
    .uri({ scheme: ["https"] })
    .required()
    .messages({
      "string.empty": "Please provide the URL to the uploaded file",
      "any.required": "file URL Needed",
      "string.uri": "Invalid URL detected"
    })
}).unknown(true);

const deleteAttachmentController: ControllerType = async (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as DeleteAttachmentBodyType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  if (fetchedUserDetails?.role !== "ADMIN") {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  const { error } = deleteAttachmentBodySchema.validate(body, {
    abortEarly: false
  });
  const errors = formatJoiErrors(error as ValidationError);

  if (errors) {
    return res
      .status(400)
      .json(constructErrorResponseBody("Invalid fields detected", errors));
  }

  const { path } = body;

  try {
    const splittedPath = path.split("/");
    const imageName = splittedPath.pop();
    const [publicId] = imageName.split(".");
    const result = await cloudinary.api.resource(`product_images/${publicId}`);
    if (!result) {
      return res.status(404).json(constructErrorResponseBody("File not found"));
    }
    await cloudinary.uploader.destroy(`product_images/${publicId}`);
    return res.status(204).end();
  } catch (error) {
    return res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as { error?: { message?: string } })?.error?.message ||
            defaultErrorMessage
        )
      );
  }
};

export default deleteAttachmentController;
