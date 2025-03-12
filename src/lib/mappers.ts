
import { Tables } from '@/integrations/supabase/types';
import { 
  Invoice, 
  BankDetails, 
  PaymentStatus, 
  Expense,
  Advance,
  FundsReceived,
  ApprovalStatus,
  PaymentMethod,
  RecipientType,
  AdvancePurpose,
  ExpenseCategory
} from '@/lib/types';

// Map from database invoice to frontend Invoice type
export const mapDbInvoiceToInvoice = (dbInvoice: Tables<'invoices'>): Invoice => {
  return {
    id: dbInvoice.id,
    date: new Date(dbInvoice.date),
    partyId: dbInvoice.party_id,
    partyName: dbInvoice.party_name,
    material: dbInvoice.material,
    quantity: dbInvoice.quantity,
    rate: dbInvoice.rate,
    gstPercentage: dbInvoice.gst_percentage,
    grossAmount: dbInvoice.gross_amount,
    netAmount: dbInvoice.net_amount,
    bankDetails: dbInvoice.bank_details as unknown as BankDetails,
    billUrl: dbInvoice.bill_url || undefined,
    invoiceImageUrl: dbInvoice.invoice_image_url || undefined,
    paymentStatus: dbInvoice.payment_status as PaymentStatus,
    createdBy: dbInvoice.created_by || '',
    createdAt: new Date(dbInvoice.created_at),
    approverType: dbInvoice.approver_type as "ho" | "supervisor" | undefined,
    siteId: dbInvoice.site_id || undefined,
    vendorName: dbInvoice.vendor_name || undefined,
    invoiceNumber: dbInvoice.invoice_number || undefined,
    amount: dbInvoice.amount || undefined,
  };
};

// Map from frontend Invoice type to database invoice for insert operations
export const mapInvoiceToDbInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>): Omit<Tables<'invoices'>, 'id' | 'created_at'> => {
  return {
    date: invoice.date.toISOString(),
    party_id: invoice.partyId,
    party_name: invoice.partyName,
    material: invoice.material,
    quantity: invoice.quantity,
    rate: invoice.rate,
    gst_percentage: invoice.gstPercentage,
    gross_amount: invoice.grossAmount,
    net_amount: invoice.netAmount,
    bank_details: invoice.bankDetails as any,
    bill_url: invoice.billUrl || null,
    invoice_image_url: invoice.invoiceImageUrl || null,
    payment_status: invoice.paymentStatus,
    created_by: invoice.createdBy || null,
    approver_type: invoice.approverType || null,
    site_id: invoice.siteId || null,
    vendor_name: invoice.vendorName || null,
    invoice_number: invoice.invoiceNumber || null,
    amount: invoice.amount || null,
  };
};
