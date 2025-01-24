import { Router } from "express";
import uploadAttachmentController from "../../controllers/attachment/uploadattachment.controller";
import { imageUpload } from "../../middlewares/multer.middleware";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import deleteAttachmentController from "../../controllers/attachment/deleteattachment.controller";

const uploadRoute = Router();

uploadRoute
  .route("/")
  .post(
    imageUpload().single("image"),
    authenticationMiddleware,
    uploadAttachmentController
  )
  .delete(deleteAttachmentController);

export default uploadRoute;
