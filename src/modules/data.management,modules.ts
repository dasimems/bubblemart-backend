import {
  AllResponseType,
  AmountType,
  CartDetailsType,
  LinkType,
  ProductDetailsType,
  ProductType
} from "../utils/types";

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
  createProduct = (
    name: string,
    type: ProductType,
    quantity: number = 0,
    amount: number,
    image: string,
    description: string
  ): ProductDetailsType => ({
    name,
    type,
    quantity,
    createdAt: new Date(),
    updates: [],
    amount: generateAmount(amount),
    image,
    description
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
    previousLink?: LinkType,
    nextLink?: LinkType
  ) => {
    let dataToReturn: {
      data: AllResponseType;
      previousLink?: LinkType;
      nextLink?: LinkType;
    } = { data };

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
  };
