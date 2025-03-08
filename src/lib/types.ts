
// User related types
export enum UserRole {
  ADMIN = "admin",
  SUPERVISOR = "supervisor",
  VIEWER = "viewer"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Financial data types
export interface BalanceSummary {
  totalBalance: number;
  fundsReceived: number;
  totalExpenditure: number;
  totalAdvances: number;
  pendingInvoices: number;
}

export interface HeadOfficeTransaction {
  id: string;
  date: Date;
  supervisorId: string;
  supervisorName: string;
  amount: number;
  description?: string;
  createdAt: Date;
}

export enum ExpenseCategory {
  TRAVEL = "travel",
  MATERIAL = "material",
  LABOR = "labor",
  OFFICE = "office",
  MISC = "misc",
  TRANSPORT = "transport",
  FOOD = "food",
  ACCOMMODATION = "accommodation",
  EQUIPMENT = "equipment",
  MAINTENANCE = "maintenance",
  STAFF_TRAVELLING_CHARGES = "STAFF TRAVELLING CHARGES",
  STATIONARY_PRINTING = "STATIONARY & PRINTING",
  DIESEL_FUEL_CHARGES = "DIESEL & FUEL CHARGES",
  LABOUR_TRAVELLING_EXP = "LABOUR TRAVELLING EXP.",
  LOADGING_BOARDING_STAFF = "LOADGING & BOARDING FOR STAFF",
  FOOD_CHARGES_LABOUR = "FOOD CHARGES FOR LABOUR",
  SITE_EXPENSES = "SITE EXPENSES",
  ROOM_RENT_LABOUR = "ROOM RENT FOR LABOUR"
}

export enum AdvancePurpose {
  MATERIAL = "material",
  WAGES = "wages",
  TRANSPORT = "transport",
  MISC = "misc"
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid"
}

export interface Expense {
  id: string;
  date: Date;
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  status: ApprovalStatus;
  createdBy: string;
  createdAt: Date;
  supervisorId?: number;
  siteName?: string;
  jobName?: string;
}

export interface Advance {
  id: string;
  date: Date;
  recipientId: string;
  recipientName: string;
  recipientType: "contractor" | "worker";
  purpose: AdvancePurpose;
  amount: number;
  status: ApprovalStatus;
  createdBy: string;
  createdAt: Date;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  email?: string;
  mobile?: string;
}

export interface MaterialItem {
  id?: string;
  material: string;
  quantity: number | null;
  rate: number | null;
  gstPercentage: number | null;
  amount: number | null;
}

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
  materialItems?: MaterialItem[];
  bankDetails: BankDetails;
  billUrl?: string;
  paymentStatus: PaymentStatus;
  createdBy: string;
  createdAt: Date;
  approverType?: "ho" | "supervisor";
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  percentage: number;
}

export interface DailyExpenseSummary {
  date: Date;
  total: number;
  categories: CategorySummary[];
}

// For recent activity feed
export enum ActivityType {
  EXPENSE = "expense",
  ADVANCE = "advance",
  INVOICE = "invoice",
  FUNDS = "funds",
  PAYMENT = "payment"
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  amount: number;
  date: Date;
  user: string;
}
