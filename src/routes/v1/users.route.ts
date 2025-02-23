import { Router } from "express";
import getUserListController from "../../controllers/user/getuserslist.controller";

const usersRoute = Router();

usersRoute.route("/").get(getUserListController);

export default usersRoute;
