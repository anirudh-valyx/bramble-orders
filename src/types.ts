export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export interface LineItem {
  sku: string;
  name: string;
  qty: number;
  unitPriceCents: number;
}

export interface Order {
  id: string; // e.g. "BR-10432"
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
  };
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
  };
  items: LineItem[];
  totalCents: number;
  currency: 'USD';
  notes?: string;
}

export interface OrderPage {
  items: Order[];
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface ListOrdersParams {
  status?: OrderStatus | 'all';
  cursor?: string | null;
  direction?: 'next' | 'prev';
}

export type JobState =
  | { state: 'queued' }
  | { state: 'running' }
  | { state: 'done'; order: Order }
  | { state: 'failed'; reason: string };
