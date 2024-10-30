import { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";

const allowedOrigins: string[] = ["https://localhost:8000"];

const corsOptions: CorsOptions = {
  methods: "GET,PUT,POST,DELETE",
  optionsSuccessStatus: 200
};

const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void
): void => {
  const origin = `https://${req.headers.host}`;

  if (origin && allowedOrigins.includes(origin)) {
    callback(null, { origin: true, ...corsOptions }); // Allow the origin
  } else {
    callback(new Error("Not allowed by CORS")); // Deny the origin
  }
};

const corsMiddleWare = (req: Request, res: Response, next: NextFunction) => {
  cors(corsOptionsDelegate)(req, res, (err) => {
    if (err) {
      return res.status(403).json({ message: "CORS policy: Access denied." });
    }
    next();
  });
};

export default corsMiddleWare;
