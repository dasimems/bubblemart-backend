import { Router } from "express";
import uploadAttachmentController from "../../controllers/attachment/uploadattachment.controller";
import { imageUpload } from "../../middlewares/multer.middleware";

const uploadRoute = Router();

uploadRoute
  .route("/")
  .post(imageUpload().single("image"), uploadAttachmentController);

export default uploadRoute;
