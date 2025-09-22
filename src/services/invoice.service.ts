import { WhatsAppService } from "./whatsapp.service";
import { Invoice } from "../types/business";
import { format } from "date-fns";
import { InvoiceTemplates } from "../templates/messageTemplates";

export class InvoiceService {
  private whatsappService: WhatsAppService;

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService;
  }

  /**
   * Send invoice PDF to customer
   */
  async sendInvoicePdf(
    clientId: string,
    invoice: Invoice,
  ): Promise<void> {
    const customer = invoice.customer;
    const pdfUrl = invoice.pdfUrl
    const caption = InvoiceTemplates.invoiceCaption(invoice);

    const filename = this.generateInvoiceFilename(invoice);
    await this.whatsappService.sendPdfFromUrl(
      clientId,
      customer.phone,
      pdfUrl,
      filename,
      caption
    );
  }

  /**
   * Send payment reminder with invoice
   */
  async sendPaymentReminderWithInvoice(
    clientId: string,
    invoice: Invoice
  ): Promise<void> {
    const customer = invoice.customer;
    const pdfUrl = invoice.pdfUrl

    const reminderMessage = InvoiceTemplates.paymentReminder(
      customer.name,
      invoice
    );
    const filename = this.generateInvoiceFilename(invoice);
    await this.whatsappService.sendPdfFromUrl(
      clientId,
      customer.phone,
      pdfUrl,
      filename,
      reminderMessage
    );
  }

  /**
   * Generate invoice filename
   */
  private generateInvoiceFilename(invoice: Invoice): string {
    return `${format(invoice.dueAt, "MMMM")}-Invoice.pdf`;
  }
}
