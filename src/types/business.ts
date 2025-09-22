// Business entity types for water delivery service

export interface Customer {
  name: string;
  phone: string;
}

export interface Delivery {
  customer: Customer;
  date: Date;
  bottlesDelivered: number;
  emptyBottlesCollected: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  deliveryPerson?: string;
}

export interface Invoice {
  customer: Customer;
  dueAt: Date;
  pdfUrl: string;
  dueAmount: number;
  status: 'unpaid' | 'partially-paid' | 'paid';
}

export interface DeliveryTemplate {
  customerName: string;
  bottlesDelivered: number;
  emptyBottlesCollected: number;
  totalAmount: number;
  deliveryDate: string;
  deliveryPerson?: string;
  nextDeliveryDate?: string;
}