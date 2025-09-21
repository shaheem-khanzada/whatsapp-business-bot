// Placeholder types for Invoice
export interface Invoice {
  id: string;
  dueAt: Date;
  status: 'unpaid' | 'partially-paid' | 'paid';
  dueAmount?: number;
}
