import { Router } from "express";
import getProductController from "../../controllers/product/getproduct.controller";
import getProductDetails from "../../controllers/product/getproductdetails.controller";

const productRoute = Router();

productRoute.route("/").get(getProductController);
productRoute.route("/:id").get(getProductDetails);

export default productRoute;
