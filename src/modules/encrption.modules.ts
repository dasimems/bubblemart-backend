import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JWTContentType } from "../utils/types";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { PaystackWebhookEvent } from "../apis/paystack";

dotenv.config();

const { env } = process;
const { JWT_PRIVATE_KEY } = env;

const saltRounds = 10;

export const encryptToken = (body: JWTContentType) => {
    if (!JWT_PRIVATE_KEY) {
      return;
    }
    const token = jwt.sign(body, JWT_PRIVATE_KEY, { expiresIn: 1209600 });
    return token;
  },
  decryptToken = (token: string) => {
    if (!JWT_PRIVATE_KEY) {
      return;
    }
    const decryptedContent: JWTContentType = jwt.verify(
      token,
      JWT_PRIVATE_KEY
    ) as JWTContentType;
    return decryptedContent;
  },
  generatePassword = (password: string) => `${password}~${env?.PASSWORD_SALT}`,
  hashPassword = async (password: string) => {
    return await bcrypt.hash(generatePassword(password), saltRounds);
  },
  compareHashedPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(generatePassword(password), hashedPassword);
  },
  verifyPaystackTransaction = (
    eventData: PaystackWebhookEvent,
    signature: string
  ): boolean => {
    const hmac = crypto.createHmac("sha512", env?.PAYSTACK_SECRET_KEY || "");
    const expectedSignature = hmac
      .update(JSON.stringify(eventData))
      .digest("hex");
    return expectedSignature === signature;
  };
