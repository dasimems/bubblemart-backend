import { Router } from "express";
import getProductController from "../../controllers/product/getproduct.controller";
import getProductDetails from "../../controllers/product/getproductdetails.controller";
import addProductController from "../../controllers/product/addproduct.controller";
import deleteProductController from "../../controllers/product/deleteproduct.controller";

const productRoute = Router();

productRoute.route("/").get(getProductController).post(addProductController);
productRoute
  .route("/:id")
  .get(getProductDetails)
  .delete(deleteProductController);

export default productRoute;
