import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JWTContentType } from "../utils/types";
import crypto from "crypto";
import bcrypt from "bcrypt";

dotenv.config();

const { env } = process;
const { JWT_PRIVATE_KEY } = env;

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32); // 32 bytes for AES-256
const iv = crypto.randomBytes(16);
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
  hashPassword = async (password: string) => {
    return await bcrypt.hash(password, saltRounds);
  },
  compareHashedPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
  };
