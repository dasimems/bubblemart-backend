import { Router } from "express";
import { loginController } from "../../controllers/auth/login.controller";
import { allPaths } from "../../utils/variables";
import { registerController } from "../../controllers/auth/register.controller";

const authRouter = Router();

authRouter.route(allPaths.login).post(loginController);
authRouter.route(allPaths.register).post(registerController);

export default authRouter;
