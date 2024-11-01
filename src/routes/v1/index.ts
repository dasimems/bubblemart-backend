import express from "express";
import { routeGroup } from "../../utils/variables";
import authRouter from "./auth/auth.route";
const v1Router = express.Router();

v1Router.use(routeGroup.auth, authRouter);

export default v1Router;
