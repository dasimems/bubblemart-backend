import dotenv from "dotenv";
import express, { Express } from "express";
import bodyParser from "body-parser";
import routes from "./routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import corsMiddleWare from "./middlewares/cors.middleware";
import mongoose from "mongoose";
import { createClient } from "redis";

dotenv.config();

export const app: Express = express();
export const { env } = process;

const uri = `mongodb+srv://${env.MONGO_DB_USERNAME}:${env.MONGO_DB_PASSWORD}@cluster0.mfkib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const redisClient = createClient();

(async () => {
  await redisClient
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
})();

export { redisClient };

export const connectDB = async () => {
  try {
    await mongoose.connect(uri, {});
    console.log("MongoDB connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection failed:", error?.message);
    process.exit(1);
  }
};

app.use(helmet());
app.use(cookieParser());
app.use(corsMiddleWare);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(mongoSanitize());

app.get("/", (_req, res) => {
  res.send("Welcome aboard");
});

app.use(routes);
