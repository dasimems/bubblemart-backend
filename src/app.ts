import dotenv from "dotenv";
import express, { Express } from "express";
import bodyParser from "body-parser";
import routes from "./routes";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import corsMiddleWare from "./middlewares/cors.middleware";

dotenv.config();

export const app: Express = express();
export const { env } = process;

app.use(helmet());
app.use(corsMiddleWare);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(mongoSanitize());

app.get("/", (_req, res) => {
  res.send("Welcome aboard");
});

app.use("/v1", routes);
