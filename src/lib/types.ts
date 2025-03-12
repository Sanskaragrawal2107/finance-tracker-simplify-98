
import { Json } from '../integrations/supabase/types';

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  VIEWER = 'viewer'
}

export enum ExpenseCategory {
  STAFF_TRAVELLING_CHARGES = 'staff_travelling_charges',
  STATIONARY_PRINTING = 'stationary_printing',
  DIESEL_FUEL_CHARGES = 'diesel_fuel_charges',
  LABOUR_TRAVELLING_EXP = 'labour_travelling_exp',
  LOADGING_BOARDING_STAFF = 'loadging_boarding_staff',
  FOOD_CHARGES_LABOUR = 'food_charges_labour',
  SITE_EXPENSES = 'site_expenses',
  ROOM_RENT_LABOUR = 'room_rent_labour',
  TRAVEL = 'travel',
  MATERIAL = 'material',
  LABOR = 'labor',
  OFFICE = 'office',
  MISC = 'misc',
  TRANSPORT = 'transport',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  EQUIPMENT = 'equipment',
  MAINTENANCE = 'maintenance'
}

export enum RecipientType {
  WORKER = 'worker',
  SUBCONTRACTOR = 'subcontractor',
  SUPERVISOR = 'supervisor'
}

export enum AdvancePurpose {
  ADVANCE = 'advance',
  SAFETY_SHOES = 'safety_shoes',
  TOOLS = 'tools',
  OTHER = 'other'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum ActivityType {
  EXPENSE = 'expense',
  ADVANCE = 'advance',
  INVOICE = 'invoice',
  FUNDS = 'funds',
  PAYMENT = 'payment'
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  email?: string;
  mobile?: string;
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
  paymentStatus?: PaymentStatus;
  approverType?: string;
  vendorName?: string;
  invoiceNumber?: string;
  billUrl?: string;
  invoiceImageUrl?: string;
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
  jobName?: string;
  posNo?: string;
  isCompleted?: boolean;
  completionDate?: Date;
  funds?: number;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: ExpenseCategory | string;
  description: string;
  siteId: string;
  siteName: string;
  status: ApprovalStatus | string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  supervisorId?: string;
}

export interface Advance {
  id: string;
  date: string | Date;
  amount: number;
  purpose: AdvancePurpose | string;
  recipientId: string;
  recipientName: string;
  recipientType: RecipientType | string;
  siteId: string;
  siteName?: string;
  status: ApprovalStatus | string;
  remarks?: string;
  createdBy: string;
  createdAt: string | Date;
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
  method?: string;
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

export interface BalanceSummary {
  fundsReceived: number;
  totalExpenditure: number;
  totalAdvances: number;
  debitsToWorker: number;
  invoicesPaid: number;
  pendingInvoices: number;
  totalBalance: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  date: Date;
  description: string;
  amount: number;
  user: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface HeadOfficeTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: string;
  status: string;
  reference?: string;
  createdAt: Date;
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
