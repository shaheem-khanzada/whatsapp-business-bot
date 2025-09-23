// Business entity types for water delivery service

export interface Delivery {
  name: string;
  phone: string;
  date: Date;
  bottlesDelivered: number;
  emptyBottlesCollected: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  deliveryPerson?: string;
}

export interface Invoice {
  name: string;
  phone: string;
  dueAt: string;
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