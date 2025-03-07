import { Router } from "express";
import clearCartController from "../../controllers/cart/clearcart.controller";
import addToCartController from "../../controllers/cart/addtocart.controller";
import deleteCartItemController from "../../controllers/cart/deletecartitem.controller";
import getCartItemsController from "../../controllers/cart/getcartitems.controller";
import updateCartController from "../../controllers/cart/updatecart.controller";
import subtractFromCartController from "../../controllers/cart/subtractfromcart.controller";
import { allPaths } from "../../utils/variables";
import orderDeliveredController from "../../controllers/order/orderdelivered.controller";

const cartRoute = Router();

cartRoute
  .route("/")
  .delete(clearCartController)
  .post(addToCartController)
  .get(getCartItemsController)
  .patch(subtractFromCartController)
  .put(updateCartController);
cartRoute.route("/:id").delete(deleteCartItemController);
cartRoute.route(`${allPaths.delivered}/:cartId`).post(orderDeliveredController);

export default cartRoute;
