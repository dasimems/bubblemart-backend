import { Router } from "express";
import deleteUserController from "../../controllers/user/deleteuseraccount.controller";
import getUserDetailsController from "../../controllers/user/getuserdetails.controller";
import updateUserController from "../../controllers/user/updateuserdetails.controller";

const userRoute = Router();

userRoute
  .route("/")
  .delete(deleteUserController)
  .get(getUserDetailsController)
  .patch(updateUserController);

export default userRoute;
