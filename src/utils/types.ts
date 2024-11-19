import { NextFunction, Request, Response } from "express";
import { Schema } from "mongoose";

export type Roles = "USER" | "ADMIN";

export type MiddleWareType = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type ControllerType = (req: Request, res: Response) => void;

export type LinkType = {
  host: string;
  route: string;
  baseUrl: string;
  commonUrl: string;
  link: string;
};

export type ProductType = "log" | "gift";

export type CoordinateType = {
  lng: number;
  lat: number;
};

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
  whole: number;
  currency: CurrencyDetailsType;
  formatted: FormattedAmountDetailsType;
};

export type ProductDetailsType = {
  name: string;
  type: ProductType;
  quantity: number;
  createdAt?: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedAt?: Date;
  updates: ChangesType[];
  amount: AmountType;
  image: string;
  description: string;
};
export type AddressDetailsType = {
  address: string;
  coordinates: CoordinateType;
  createdAt?: Date;
  userId: Schema.Types.ObjectId;
  lastUpdatedAt?: Date;
  updates: ChangesType[];
};

export type CartDetailsType = {
  productDetails: {
    id: Schema.Types.ObjectId;
    image: string;
    name: string;
    amount: AmountType;
  };
  createdAt: Date;
  lastUpdatedAt?: Date;
  updates: ChangesType[];
  userId: Schema.Types.ObjectId;
  orderId: Schema.Types.ObjectId;
  quantity: number;
  paidAt?: Date;
};

export type JWTContentType = {
  role: Roles;
  id: string;
  ipAddress: string;
  createdAt: Date;
  expiredAt: Date;
};

export type UserDetailsType = {
  email: string;
  name: string;
  password: string;
  role?: Roles;
  createdAt?: Date;
  updates: ChangesType[];
  updatedAt?: Date;
  avatar?: string;
};

export type AuthenticationDestructuredType = {
  userTokenRole: Roles;
  userTokenId: string;
  fetchedUserDetails: UserDetailsType & { id: Schema.Types.ObjectId };
};

export type UserDetailsResponseType = {
  id: string;
} & Omit<UserDetailsType, "password" | "updates">;

export type ProductDetailsResponseType = {
  id: string;
} & Omit<
  ProductDetailsType,
  "createdAt" | "createdBy" | "lastUpdatedAt" | "updates"
>;
export type AddressDetailsResponseType = {
  id: string;
} & Omit<AddressDetailsType, "userId" | "lastUpdatedAt" | "updates">;

export type CartDetailsResponseType = {
  id: string;
  totalPrice: AmountType;
  isAvailable?: boolean;
} & Omit<
  CartDetailsType,
  "createdAt" | "lastUpdatedAt" | "updates" | "userId" | "paidAt" | "orderId"
>;

export type AllResponseType =
  | UserDetailsResponseType
  | ProductDetailsResponseType[]
  | ProductDetailsResponseType
  | AddressDetailsResponseType
  | AddressDetailsResponseType[]
  | CartDetailsResponseType
  | CartDetailsResponseType[];
