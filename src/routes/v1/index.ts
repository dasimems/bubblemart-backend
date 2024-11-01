import express from "express";
import { routeGroup } from "../../utils/variables";
import authRouter from "./auth.route";
import productRoute from "./product.route";
const v1Router = express.Router();

v1Router.use(routeGroup.auth, authRouter);
v1Router.use(routeGroup.product, productRoute);

export default v1Router;
