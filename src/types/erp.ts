// ─── ERP 扩展类型定义 ────────────────────────────────────────────────────────

export type FinanceType = 'income' | 'expense';
export type FinanceCategory = 'sales' | 'purchase' | 'salary' | 'rent' | 'tax' | 'other';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type WorkOrderStatus = 'planned' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday';

// ─── 财务模块 ─────────────────────────────────────────────────────────────────

export interface FinanceRecord {
  id: string;
  recordNo: string;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  currency: string;
  description: string;
  relatedParty: string;   // 客户/供应商名称
  relatedOrderNo: string; // 关联单据号
  accountDate: string;    // 记账日期
  dueDate: string;        // 到期日
  paymentStatus: PaymentStatus;
  paidAmount: number;
  operator: string;
  notes: string;
  createdAt: string;
}

export interface AccountsReceivable {
  id: string;
  arNo: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderNo: string;
  invoiceAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: PaymentStatus;
  notes: string;
  createdAt: string;
}

export interface AccountsPayable {
  id: string;
  apNo: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderNo: string;
  invoiceAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: PaymentStatus;
  notes: string;
  createdAt: string;
}

// ─── HR 模块 ──────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  parentId: string;
  headcount: number;
  budget: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  empNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string;
  hireDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  baseSalary: number;
  status: 'active' | 'inactive' | 'resigned';
  address: string;
  emergencyContact: string;
  notes: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  overtimeHours: number;
  notes: string;
}

export interface PayrollRecord {
  id: string;
  payrollNo: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  period: string;       // 'YYYY-MM'
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  socialInsurance: number;
  tax: number;
  netSalary: number;
  payDate: string;
  status: 'draft' | 'approved' | 'paid';
  notes: string;
  createdAt: string;
}

// ─── CRM 模块 ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  customerNo: string;
  name: string;
  type: 'individual' | 'enterprise';
  industry: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  level: 'A' | 'B' | 'C' | 'D';   // 客户等级
  totalPurchase: number;
  lastPurchaseDate: string;
  assignedTo: string;               // 负责销售
  status: 'active' | 'inactive' | 'potential';
  tags: string;
  notes: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  oppNo: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;        // 0-100
  expectedCloseDate: string;
  assignedTo: string;
  source: string;             // 来源渠道
  products: string;           // 意向产品
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  title: string;
  customerId: string;
  customerName: string;
  type: 'sales' | 'purchase' | 'service' | 'other';
  amount: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  signedDate: string;
  assignedTo: string;
  attachments: string;
  notes: string;
  createdAt: string;
}

// ─── 采购模块 ─────────────────────────────────────────────────────────────────

export interface PurchaseRequest {
  id: string;
  prNo: string;
  departmentId: string;
  departmentName: string;
  requestorId: string;
  requestorName: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalEstimated: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  requiredDate: string;
  reason: string;
  status: ApprovalStatus;
  approverId: string;
  approverName: string;
  approvedAt: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  currency: string;
  expectedDate: string;
  receivedDate: string;
  paymentTerms: string;
  status: ApprovalStatus | 'received' | 'partial_received';
  operator: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQty: number;
}

// ─── 生产模块 ─────────────────────────────────────────────────────────────────

export interface BOMItem {
  id: string;
  materialName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface ProductionPlan {
  id: string;
  planNo: string;
  productName: string;
  sku: string;
  plannedQty: number;
  completedQty: number;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  bom: BOMItem[];
  notes: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  woNo: string;
  planId: string;
  planNo: string;
  productName: string;
  sku: string;
  targetQty: number;
  completedQty: number;
  unit: string;
  assignedTo: string;
  workStation: string;
  startDate: string;
  endDate: string;
  actualStart: string;
  actualEnd: string;
  status: WorkOrderStatus;
  qualityRate: number;    // 良品率 0-100
  notes: string;
  createdAt: string;
}

// ─── ERP 全局状态 ─────────────────────────────────────────────────────────────

export interface ERPState {
  // 财务
  financeRecords: FinanceRecord[];
  accountsReceivable: AccountsReceivable[];
  accountsPayable: AccountsPayable[];
  // HR
  departments: Department[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  // CRM
  customers: Customer[];
  opportunities: Opportunity[];
  contracts: Contract[];
  // 采购
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  // 生产
  productionPlans: ProductionPlan[];
  workOrders: WorkOrder[];
}
