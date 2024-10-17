import dotenv from "dotenv";
import express, { Express } from "express";
import bodyParser from "body-parser";
import routes from "./routes";
import helmet from "helmet";
import cors, { CorsOptions, CorsRequest } from "cors";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config();

const allowedOrigins: string[] = [
  "https://example1.com",
  "https://example2.com",
  "http://localhost:3000"
];

const corsOptions: CorsOptions = {
  methods: "GET,PUT,POST,DELETE",
  optionsSuccessStatus: 200
};

const corsOptionsDelegate = (
  req: CorsRequest,
  callback: (err: Error | null, options?: CorsOptions) => void
): void => {
  const origin = req.header("Origin");

  if (origin && allowedOrigins.includes(origin)) {
    callback(null, { origin: true, ...corsOptions }); // Allow the origin
  } else {
    callback(null, { origin: false }); // Deny the origin
  }
};

export const app: Express = express();
export const env = process.env;

app.use(helmet());
app.use(cors(corsOptionsDelegate));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(mongoSanitize());

app.use(routes);
