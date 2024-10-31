import express from "express";
import loginRouter from "./auth/login.route";
import { allRoutes } from "../../utils/variables";
const v1Router = express.Router();

v1Router.use(allRoutes.login, loginRouter);

export default v1Router;
