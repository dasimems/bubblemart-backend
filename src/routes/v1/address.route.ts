import { Router } from "express";
import createAddressController from "../../controllers/address/createaddress.controller";
import getAddressDetailsController from "../../controllers/address/getaddressdetails.controller";
import deleteAddressController from "../../controllers/address/deleteaddress.controller";
import updateAddressController from "../../controllers/address/updateaddress.controller";
import getAddressesController from "../../controllers/address/getaddresses.controller";

const addressRoute = Router();

addressRoute
  .route("/")
  .post(createAddressController)
  .get(getAddressesController);
addressRoute
  .route("/:id")
  .get(getAddressDetailsController)
  .delete(deleteAddressController)
  .put(updateAddressController);

export default addressRoute;
