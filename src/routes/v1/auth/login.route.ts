import { Router } from "express";
import { loginController } from "../../../controllers/auth/login.controller";

const loginRouter = Router();

loginRouter.route("/").post(loginController);

export default loginRouter;
