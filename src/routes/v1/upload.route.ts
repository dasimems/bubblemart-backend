import { Router } from "express";
import uploadAttachmentController from "../../controllers/attachment/uploadattachment.controller";
import { imageUpload } from "../../middlewares/multer.middleware";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";

const uploadRoute = Router();

uploadRoute
  .route("/")
  .post(
    imageUpload().single("image"),
    authenticationMiddleware,
    uploadAttachmentController
  );

export default uploadRoute;
