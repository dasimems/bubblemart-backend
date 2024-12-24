import { Request } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { MiddleWareType } from "../utils/types";

dotenv.config();
const { env } = process;

const originList = env?.CLIENT_URL_LIST || "";
const allowedOrigins: string[] = originList.split(",");

const corsOptions: CorsOptions = {
  methods: "GET,PUT,POST,DELETE",
  optionsSuccessStatus: 200
};

const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void
): void => {
  // const origin = `https://${req.headers.origin}`;
  const { origin, host, from, location } = req?.headers || {};
  console.log("origin", origin);
  console.log("host", host);
  console.log("from", from);
  console.log("location", location);
  if (origin && allowedOrigins.includes(origin)) {
    callback(null, { origin: true, ...corsOptions }); // Allow the origin
  } else {
    callback(new Error("Not allowed by CORS")); // Deny the origin
  }
};

const corsMiddleWare: MiddleWareType = (req, res, next) => {
  cors(corsOptionsDelegate)(req, res, (err) => {
    if (err) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  });
};

export default corsMiddleWare;
