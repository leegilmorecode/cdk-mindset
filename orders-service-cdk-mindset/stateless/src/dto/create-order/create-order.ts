export interface CreateOrder {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price?: number;
  }[];
  total: number;
}
