import { Request } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { MiddleWareType } from "../utils/types";
import { getIpAddress } from "../modules";

dotenv.config();
const { env } = process;

const originList = env?.CLIENT_URL_LIST || "";
const ipAddressList = env?.ALLOWED_IP_LIST || "";
const allowedOrigins: string[] = originList.split(",");
const allowedIpAddresses: string[] = ipAddressList.split(",");

const corsOptions: CorsOptions = {
  methods: "GET,PUT,POST,DELETE,PATCH",
  optionsSuccessStatus: 200
};

const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void
): void => {
  // const origin = `https://${req.headers.origin}`;
  const ipAddress = getIpAddress(req);

  const { origin } = req?.headers || {};

  if (
    (origin && allowedOrigins.includes(origin)) ||
    (ipAddress && allowedIpAddresses.includes(ipAddress))
  ) {
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
