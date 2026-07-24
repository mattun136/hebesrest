export type OrderStatus = "received" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "invoiced" | "paid";

export interface OrderCustomer {
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
}

export interface OrderShipping {
  sameAsCustomer: boolean;
  name?: string;
  phone?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  desiredDate?: string;
  desiredTimeSlot?: string;
  note?: string;
}

export interface OrderGift {
  noshi: boolean;
  nameEntry?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantLabel: string;
  unitPriceJPY: number;
  quantity: number;
  subtotalJPY: number;
}

export interface OrderConsents {
  privacy: boolean;
  orderContent: boolean;
  cancellationPolicy: boolean;
}

export interface Order {
  orderId: string;
  idempotencyKey: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: OrderCustomer;
  shipping: OrderShipping;
  gift: OrderGift;
  items: OrderItem[];
  shippingFeeJPY: number;
  totalJPY: number;
  consents: OrderConsents;
  source: "HEBEREST-web";
}
