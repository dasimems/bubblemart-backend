import { Router } from "express";
import getProductController from "../../controllers/product/getproduct.controller";
import getProductDetails from "../../controllers/product/getproductdetails.controller";
import addProductController from "../../controllers/product/addproduct.controller";
import deleteProductController from "../../controllers/product/deleteproduct.controller";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import updateProductController from "../../controllers/product/updateproduct.controller";

const productRoute = Router();

productRoute
  .route("/")
  .get(getProductController)
  .post(authenticationMiddleware, addProductController);
productRoute
  .route("/:id")
  .get(getProductDetails)
  .delete(authenticationMiddleware, deleteProductController)
  .patch(authenticationMiddleware, updateProductController);

export default productRoute;
