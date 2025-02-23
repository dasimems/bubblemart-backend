import { Router } from "express";
import getUserListController from "../../controllers/user/getuserslist.controller";
import getUserDetailsController from "../../controllers/user/getuserdetails.controller";

const usersRoute = Router();

usersRoute.route("/").get(getUserListController);
usersRoute.route("/:id").get(getUserDetailsController);

export default usersRoute;
