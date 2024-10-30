import express from "express";
import v1Router from "./v1";
const routes = express.Router();

routes.use("/v1", v1Router);

export default routes;
