import express from "express";
import { routeGroup } from "../../utils/variables";
import authRouter from "./auth.route";
import productRoute from "./product.route";
import addressRoute from "./address.route";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
const v1Router = express.Router();

v1Router.use(routeGroup.auth, authRouter);
v1Router.use(routeGroup.product, productRoute);
v1Router.use(routeGroup.address, authenticationMiddleware, addressRoute);

export default v1Router;
