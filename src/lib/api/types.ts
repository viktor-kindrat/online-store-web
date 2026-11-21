export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryMethodCode = 'COURIER' | 'POSTAL_SERVICE' | 'PICKUP';

export interface UserView {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceMinor: number;
  status: ProductStatus;
}

export interface Paginated<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItemView {
  id: string;
  productId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface CartView {
  id: string;
  items: CartItemView[];
  subtotalMinor: number;
}

export interface DeliveryMethod {
  code: DeliveryMethodCode;
  name: string;
  feeMinor: number;
}

export interface QuoteLineView {
  productId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  availableQuantity: number;
  lineTotalMinor: number;
}

export interface QuoteView {
  items: QuoteLineView[];
  subtotalMinor: number;
  discountMinor: number;
  deliveryMethod: DeliveryMethodCode;
  deliveryFeeMinor: number;
  totalMinor: number;
}

export interface OrderItemView {
  productId: string;
  productName: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  subtotalMinor: number;
  discountMinor: number;
  deliveryMethod: DeliveryMethodCode;
  deliveryFeeMinor: number;
  totalMinor: number;
  shippingAddress: { city: string; street: string; postalCode: string };
  items: OrderItemView[];
  createdAt: string;
}

export interface PaymentInitiatedView {
  paymentId: string;
  providerReference: string;
  redirectUrl: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  minOrderMinor: number;
  expiresAt: string;
  usageLimit: number;
}

export interface StockBalanceView {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  totalMinor: number;
  orderCount: number;
}

export interface SalesByCategoryRow {
  categoryId: string;
  categoryName: string;
  unitsSold: number;
  revenueMinor: number;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueMinor: number;
}
