import { ValidationError } from "joi";
import crypto from "crypto";
import {
  AmountType,
  CartDetailsType,
  CartProductDetails,
  LinkType,
  OrderDetailsType,
  ProductDetailsType,
  ProductType,
  UserDetailsType
} from "../utils/types";
import { Schema } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;

export const generateAmount = (inputtedAmount: number): AmountType => {
    const amount = inputtedAmount * 1000,
      formattedAmount = amount / 1000,
      withCurrency = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN"
      }).format(formattedAmount),
      withoutCurrency = new Intl.NumberFormat("en-US").format(formattedAmount);
    return {
      amount,
      whole: inputtedAmount,
      currency: { name: "Naira", symbol: "NGN" },
      formatted: {
        withCurrency,
        withoutCurrency
      }
    };
  },
  getBaseUrl = (protocol: string, host: string) => {
    return `${protocol}://${host}/v1`;
  },
  createUser = (
    email: string,
    name: string,
    password: string
  ): UserDetailsType => {
    return {
      email,
      name,
      password,
      updates: []
    };
  },
  createOrder = (
    cartItems: Schema.Types.ObjectId[],
    userId: Schema.Types.ObjectId,
    addressId?: Schema.Types.ObjectId
  ): OrderDetailsType => ({
    cartItems,
    userId,
    updates: [],
    addressId
  }),
  createProduct = (
    name: string,
    type: ProductType,
    quantity: number = 0,
    amount: number,
    image: string,
    description: string,
    createdBy: Schema.Types.ObjectId
  ): ProductDetailsType => ({
    name,
    type,
    quantity,
    createdAt: new Date(),
    updates: [],
    amount: generateAmount(amount),
    image,
    description,
    createdBy
  }),
  generateProductResponse = () => {},
  createCart = (
    userId: Schema.Types.ObjectId,
    quantity: number,
    productDetails: CartProductDetails
  ): CartDetailsType => ({
    userId,
    productDetails,
    quantity,
    createdAt: new Date(),
    updates: []
  }),
  constructSuccessResponseBody = <T>(
    data: T,
    total?: number,
    pageNum?: number,
    activePage?: number,
    previousLink?: LinkType,
    nextLink?: LinkType
  ) => {
    let dataToReturn: {
      data: T;
      total?: number;
      pageNum?: number;
      activePage?: number;
      previousLink?: LinkType;
      nextLink?: LinkType;
    } = { data };

    if (total !== undefined && total !== null && !isNaN(total)) {
      dataToReturn = {
        ...dataToReturn,
        total
      };
    }

    if (pageNum) {
      dataToReturn = {
        ...dataToReturn,
        pageNum
      };
    }
    if (activePage) {
      dataToReturn = {
        ...dataToReturn,
        activePage
      };
    }

    if (previousLink) {
      dataToReturn = {
        ...dataToReturn,
        previousLink
      };
    }
    if (nextLink) {
      dataToReturn = {
        ...dataToReturn,
        nextLink
      };
    }
    return dataToReturn;
  },
  constructErrorResponseBody = (
    message: string,
    error?: { [name: string]: string }
  ) => {
    return {
      message,
      error
    };
  },
  formatJoiErrors = (error: ValidationError) => {
    if (
      !error ||
      !error.details ||
      (error.details && !Array.isArray(error.details))
    ) {
      return undefined;
    }

    return error.details.reduce<{ [key: string]: string }>((acc, curr) => {
      acc[curr?.context?.key || curr?.path?.join(".")] = curr.message;
      return acc;
    }, {});
  },
  encryptData = (data: string, encryptionKey: string) => {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted; // Return IV + Encrypted data
  },
  decryptData = (encryptedData: string, encryptionKey: string) => {
    try {
      const [ivHex, encryptedText] = encryptedData.split(":");
      if (!ivHex || !encryptedText) {
        throw new Error("Invalid decryption!");
      }
      const iv = Buffer.from(ivHex, "hex");

      if (iv.length !== 16) {
        throw new Error("Invalid decryption!");
      }
      if (encryptionKey.length !== 32) {
        throw new Error("Invalid decryption!");
      }
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        encryptionKey,
        iv
      );
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      throw new Error("Invalid decryption!");
    }
  },
  hashDataWithSalt = (data: string, salt: string) => {
    const hash = crypto.createHash("sha256");
    hash.update(data + salt);
    return hash.digest("hex");
  },
  verifySaltedHash = (data: string, salt: string, originalHash: string) => {
    const hashedData = hashDataWithSalt(data, salt);
    return hashedData === originalHash;
  },
  getOrderEncryptKey = (orderId: string, userId: string, time: number) => {
    const encryptionKey = Buffer.from(
      (env.ORDER_ENCRYPTION_KEY + "k".repeat(16)).slice(0, 16),
      "utf8"
    );
    return `${orderId}-<${encryptionKey}>-${userId}-<${encryptionKey}>-${time}`;
  };
