import { Router } from "express";
import getProductController from "../../controllers/product/getproduct.controller";

const productRoute = Router();

productRoute.route("/").get(getProductController);

export default productRoute;
