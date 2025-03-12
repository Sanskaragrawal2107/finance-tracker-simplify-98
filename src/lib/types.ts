
import { Json } from '../integrations/supabase/types';

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  VIEWER = 'viewer'
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

// Type for handling JSON bank details from Supabase
export type SupabaseBankDetails = Json;

export interface Invoice {
  id: string;
  date: Date;
  partyId: string;
  partyName: string;
  material: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
  grossAmount: number;
  netAmount: number;
  bankDetails: BankDetails;
  siteId: string;
  siteName: string;
  status: 'pending' | 'paid' | 'cancelled';
  remarks: string;
  paymentDate?: Date;
  paymentReference?: string;
  createdAt: Date;
  createdBy: string;
  amount: number;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'completed' | 'on-hold';
  supervisorId: string;
  supervisorName: string;
  clientName: string;
  contactPerson: string;
  contactNumber: string;
  startDate: Date;
  endDate?: Date;
  budget: number;
  description?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  siteId: string;
  siteName: string;
  status: 'pending' | 'approved' | 'rejected';
  attachmentUrl?: string;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Advance {
  id: string;
  date: string;
  amount: number;
  purpose: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'staff' | 'contractor' | 'supplier';
  siteId: string;
  siteName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'settled';
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface FundsReceived {
  id: string;
  date: Date;
  amount: number;
  source: string;
  reference: string;
  remarks?: string;
  siteId?: string;
  siteName?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'expense' | 'invoice' | 'advance' | 'funds' | 'payment';
  amount: number;
  description: string;
  siteId?: string;
  siteName?: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  reference?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  contactNumber?: string;
  profileUrl?: string;
  createdAt: Date;
}

export interface Contractor {
  id: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  address?: string;
  bankDetails?: BankDetails;
  specialty: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  address?: string;
  bankDetails?: BankDetails;
  materials: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface SiteBalance {
  siteId: string;
  siteName: string;
  totalFunds: number;
  totalExpenses: number;
  totalInvoices: number;
  totalAdvances: number;
  balance: number;
}

// Component Props Interfaces
export interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, "id" | "createdAt">) => void;
}

export interface InvoiceDetailsProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onMakePayment?: (invoice: Invoice) => void;
}
