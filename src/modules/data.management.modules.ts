import { ValidationError } from "joi";
import {
  AllResponseType,
  AmountType,
  CartDetailsType,
  LinkType,
  ProductDetailsType,
  ProductType,
  UserDetailsType
} from "../utils/types";
import { Schema } from "mongoose";

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
    userId: string,
    productId: string,
    quantity: string
  ): CartDetailsType => ({
    userId,
    productId,
    quantity,
    createdAt: new Date(),
    updates: []
  }),
  constructSuccessResponseBody = (
    data: AllResponseType,
    total?: number,
    pageNum?: number,
    activePage?: number,
    previousLink?: LinkType,
    nextLink?: LinkType
  ) => {
    let dataToReturn: {
      data: AllResponseType;
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
  };
