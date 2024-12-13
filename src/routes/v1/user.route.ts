import { Router } from "express";
import deleteUserController from "../../controllers/user/deleteuseraccount.controller";
import getUserDetailsController from "../../controllers/user/getuserdetails.controller";
import updateUserController from "../../controllers/user/updateuserdetails.controller";
import logoutController from "../../controllers/user/logout.controller";
import { allPaths } from "../../utils/variables";

const userRoute = Router();

userRoute
  .route("/")
  .delete(deleteUserController)
  .get(getUserDetailsController) 
  .patch(updateUserController);
userRoute.route(allPaths.logout).delete(logoutController);

export default userRoute;
