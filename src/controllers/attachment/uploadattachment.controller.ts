import { MongoError } from "mongodb";
import fs from "fs";
import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import cloudinary from "../../utils/cloudinary";
import {
  AuthenticationDestructuredType,
  ControllerType
} from "../../utils/types";
import { defaultErrorMessage } from "../../utils/variables";

const uploadAttachmentController: ControllerType = async (req, res) => {
  const { body } = req;

  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }

  if (fetchedUserDetails?.role !== "ADMIN") {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  const fileToUpload = req.file;
  if (!fileToUpload) {
    return res.status(400).json(constructErrorResponseBody("No file sent"));
  }
  const { path } = fileToUpload;
  try {
    const [fname] = fileToUpload?.originalname?.split(".")[0]?.split(" ") || [];
    const fileName = `${fetchedUserDetails?.id}-${Date.now()}-${fname}`;

    if (!fileName) {
      return res
        .status(500)
        .json(constructErrorResponseBody("File name not present"));
    }

    const { secure_url: link } = await cloudinary.uploader.upload(path, {
      resource_type: "image",
      public_id: `product_images/${fileName}`
    });
    const data = { link };
    return res.status(201).json(constructSuccessResponseBody(data));
  } catch (error) {
    return res
      .status(500)
      .json(
        constructErrorResponseBody(
          (error as MongoError)?.message || defaultErrorMessage
        )
      );
  } finally {
    fs.access(path, (err) => {
      if (!err) {
        fs.unlinkSync(path);
      }
    });
  }
};

export default uploadAttachmentController;
