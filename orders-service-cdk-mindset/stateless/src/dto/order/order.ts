export interface Order {
  pk: string;
  sk: string;
  id: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price?: number;
  }[];
  total: number;
  status: string;
  created: string;
  updated: string;
}
