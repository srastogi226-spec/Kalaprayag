import { InvoiceData } from '../types';

/**
 * Generates a unique invoice number in the format KP-INV-XXXXXX
 */
export const generateInvoiceNumber = (): string => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `KP-INV-${random}`;
};

/**
 * Formats a date for the invoice (e.g., 08 Mar 2026)
 */
export const formatInvoiceDate = (dateString?: string): string => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Calculates tax and totals for invoice items
 */
export const calculateInvoiceTotals = (items: { quantity: number; unitPrice: number }[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstRate = 0.18;
    const gstAmount = Math.round(subtotal * gstRate);
    const totalAmount = subtotal + gstAmount;

    return {
        subtotal,
        gstRate: 18,
        gstAmount,
        totalAmount
    };
};

/**
 * Simulates sending an invoice via email
 */
export const emailInvoice = async (invoice: InvoiceData): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Emailing invoice ${invoice.invoiceNumber} to ${invoice.customer.email}`);
    return true;
};

/**
 * Triggers the browser's print dialog for the invoice
 */
export const downloadInvoicePDF = (invoiceId: string) => {
    const printContent = document.getElementById(invoiceId);
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;

    // We use a simpler approach for React: window.print()
    // But to only print the invoice, we can use CSS media queries
    window.print();
};
