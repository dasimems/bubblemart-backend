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

export type PaystackInitiateTransactionResponseType = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type OrderStatusType = "PAID" | "PENDING" | "DELIVERED";

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

export type LogType = {
  email: string;
  password: string;
};

export type LogDetailsType = {
  createdAt?: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedAt?: Date;
  productId: Schema.Types.ObjectId;
  updates: ChangesType[];
  assignedTo?: Schema.Types.ObjectId;
} & LogType;

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

export type CartProductDetails = {
  id: Schema.Types.ObjectId;
  image: string;
  name: string;
  amount: AmountType;
  type: ProductType;
  description: string;
};

export type CartDetailsType = {
  productDetails: CartProductDetails;
  createdAt: Date;
  lastUpdatedAt?: Date;
  updates: ChangesType[];
  userId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  quantity: number;
  paidAt?: Date;
  deliveredAt?: Date;
};

export type ContactInformationType = {
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhoneNumber: string;
  shortNote: string;
  longitude: number;
  latitude: number;
};

export type OrderDetailsType = {
  cartItems: Schema.Types.ObjectId[];
  userId: Schema.Types.ObjectId;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt?: Date;
  paymentInitiatedAt?: Date;
  lastUpdatedAt?: Date;
  updates: ChangesType[];
  paymentReference?: string;
  contactInformation?: ContactInformationType | null;
  status?: OrderStatusType;
  deliveredAt?: Date;
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

export type LogDetailsResponseType = {
  id: string;
} & Omit<
  LogDetailsType,
  "createdAt" | "createdBy" | "lastUpdatedAt" | "productId" | "updates"
>;

export type ProductDetailsResponseType = {
  id: string;
  logs?: LogDetailsResponseType[];
} & Omit<ProductDetailsType, "createdBy" | "lastUpdatedAt" | "updates">;
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
export type CartResponseType = {
  carts: CartDetailsResponseType[];
  isAddressNeeded: boolean;
};
export type OrderDetailsResponseType = {
  id: string;
  cartItems: CartDetailsResponseType[];
  paymentMethod?: string;
  checkoutDetails: PaystackInitiateTransactionResponseType | null;
  user?: UserDetailsResponseType;
} & Omit<
  OrderDetailsType,
  "lastUpdatedAt" | "updates" | "userId" | "cartItems"
>;

export type AllResponseType =
  | UserDetailsResponseType
  | ProductDetailsResponseType[]
  | ProductDetailsResponseType
  | AddressDetailsResponseType
  | AddressDetailsResponseType[]
  | CartDetailsResponseType
  | CartDetailsResponseType[];
