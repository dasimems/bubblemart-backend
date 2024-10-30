import { NextFunction, Request, Response } from "express";

declare global {
  export type MiddleWareType = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;

  export type ProductType = "log" | "gift";

  export type CurrencyDetailsType = {
    symbol: string;
    name: string;
  };

  export type FormattedAmountDetailsType = {
    withoutCurrency: string;
    withCurrency: string;
  };

  export type ChangesType = {
    description: string;
    updatedAt: Date;
  };

  export type AmountType = {
    amount: number;
    currency: CurrencyDetailsType;
    formatted: FormattedAmountDetailsType;
  };

  export type ProductDetailsType = {
    name: string;
    type: ProductType;
    quantity: number;
    createdAt: Date;
    updates: ChangesType[];
    amount: AmountType;
    image: string;
    description: string;
  };

  export type CartDetailsType = {
    productId: string;
    createdAt: Date;
    updates: ChangesType[];
    userId: string;
    quantity: string;
  };
}

export {};
