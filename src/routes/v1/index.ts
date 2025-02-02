import express from "express";
import { routeGroup } from "../../utils/variables";
import authRouter from "./auth.route";
import productRoute from "./product.route";
import addressRoute from "./address.route";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import cartRoute from "./cart.route";
import orderRoute from "./order.route";
import userRoute from "./user.route";
import uploadRoute from "./upload.route";
import paymentRoute from "./payment.route";
const v1Router = express.Router();

v1Router.use(routeGroup.auth, authRouter);
v1Router.use(routeGroup.product, productRoute);
v1Router.use(routeGroup.user, authenticationMiddleware, userRoute);
v1Router.use(routeGroup.cart, authenticationMiddleware, cartRoute);
v1Router.use(routeGroup.order, authenticationMiddleware, orderRoute);
v1Router.use(routeGroup.address, authenticationMiddleware, addressRoute);
v1Router.use(routeGroup.upload, authenticationMiddleware, uploadRoute);
v1Router.use(routeGroup.payment, authenticationMiddleware, paymentRoute);

export default v1Router;
