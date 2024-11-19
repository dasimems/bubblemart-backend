import { Router } from "express";
import clearCartController from "../../controllers/cart/clearcart.controller";
import addToCartController from "../../controllers/cart/addtocart.controller";
import deleteCartItemController from "../../controllers/cart/deletecartitem.controller";
import getCartItemsController from "../../controllers/cart/getcartitems.controller";
import updateCartController from "../../controllers/cart/updatecart.controller";
import subtractFromCartController from "../../controllers/cart/subtractfromcart.controller";

const cartRoute = Router();

cartRoute
  .route("/")
  .delete(clearCartController)
  .post(addToCartController)
  .get(getCartItemsController)
  .patch(subtractFromCartController);
cartRoute
  .route("/:id")
  .delete(deleteCartItemController)
  .post(updateCartController);

export default cartRoute;
