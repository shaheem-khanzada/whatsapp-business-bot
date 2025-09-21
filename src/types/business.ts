// Business entity types for water delivery service

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  deliveryArea: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Delivery {
  id: string;
  customerId: string;
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
  id: string;
  customerId: string;
  customer: Customer;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'unpaid' | 'partially-paid' | 'paid';
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Notification {
  id: string;
  type: 'delivery' | 'vacation' | 'service_announcement' | 'payment_reminder';
  title: string;
  message: string;
  targetAudience: 'all' | 'specific_area' | 'specific_customers';
  targetArea?: string;
  targetCustomerIds?: string[];
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: Date;
  sentAt?: Date;
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

export interface VacationNotification {
  startDate: string;
  endDate: string;
  reason: string;
  alternativeContact?: string;
  resumptionDate: string;
}
