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
import rateLimit from "express-rate-limit";
import csrf from "csurf";

dotenv.config();

export const app: Express = express();
export const { env } = process;

const uri = `mongodb+srv://${env?.MONGO_DB_USERNAME}:${env?.MONGO_DB_PASSWORD}@${env?.MONGO_CLUSTER_STRING}.mongodb.net/?retryWrites=true&w=majority&appName=${env?.MONGO_DB_APPNAME}`;

const csrfProtection = csrf({ cookie: true });

const redisClient = createClient({ url: env?.REDIS_URL });

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
  statusCode: 429,
  headers: true
});

(async () => {
  await redisClient
    .on("error", (err) => {
      console.log("Redis Client Error", err);
      process.exit(1);
    })
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
app.set("trust proxy", 1);
app.use(corsMiddleWare);
app.use(limiter);
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  })
);
// app.use(
//   helmet.hsts({
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true
//   })
// );
app.use(helmet.frameguard({ action: "deny" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(csrfProtection);
app.use(mongoSanitize());

app.get("/", (_req, res) => {
  res.send("Welcome aboard");
});

app.use(routes);
// app.use(((err: any, _: Request, res: Response, next: NextFunction) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: err.message });
//   }
//   if (err) {
//     return res.status(500).json({ error: err.message });
//   }
//   next();
// }) as any);
