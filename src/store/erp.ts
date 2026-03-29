import {
  ERPState, FinanceRecord, AccountsReceivable, AccountsPayable,
  Department, Employee, AttendanceRecord, PayrollRecord,
  Customer, Opportunity, Contract,
  PurchaseRequest, PurchaseOrder,
  ProductionPlan, WorkOrder
} from '../types/erp';
import { sanitizeForStorage } from '../utils/security';

const STORAGE_KEY = 'erp_data';
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
const now = () => new Date().toISOString().split('T')[0];
const thisMonth = () => new Date().toISOString().substring(0, 7);

// ─── 演示数据 ─────────────────────────────────────────────────────────────────
const seedERPData = (): ERPState => ({
  financeRecords: [
    { id: 'fr1', recordNo: 'FIN-2024-001', type: 'income', category: 'sales', amount: 58000, currency: 'CNY', description: '3月销售收入', relatedParty: '北京科技公司', relatedOrderNo: 'ORD-2024-001', accountDate: '2024-03-31', dueDate: '2024-04-15', paymentStatus: 'paid', paidAmount: 58000, operator: '财务张三', notes: '', createdAt: '2024-03-31' },
    { id: 'fr2', recordNo: 'FIN-2024-002', type: 'expense', category: 'purchase', amount: 32000, currency: 'CNY', description: '电子元件采购', relatedParty: '优质电子科技有限公司', relatedOrderNo: 'PO-2024-001', accountDate: '2024-03-20', dueDate: '2024-04-20', paymentStatus: 'unpaid', paidAmount: 0, operator: '财务张三', notes: '待付款', createdAt: '2024-03-20' },
    { id: 'fr3', recordNo: 'FIN-2024-003', type: 'expense', category: 'salary', amount: 125000, currency: 'CNY', description: '3月员工薪资', relatedParty: '全体员工', relatedOrderNo: '', accountDate: '2024-03-31', dueDate: '2024-03-31', paymentStatus: 'paid', paidAmount: 125000, operator: '财务张三', notes: '', createdAt: '2024-03-31' },
    { id: 'fr4', recordNo: 'FIN-2024-004', type: 'income', category: 'sales', amount: 24800, currency: 'CNY', description: '上海贸易订单', relatedParty: '上海贸易有限公司', relatedOrderNo: 'ORD-2024-002', accountDate: '2024-03-18', dueDate: '2024-04-18', paymentStatus: 'partial', paidAmount: 10000, operator: '财务李四', notes: '已付首款', createdAt: '2024-03-18' },
    { id: 'fr5', recordNo: 'FIN-2024-005', type: 'expense', category: 'rent', amount: 45000, currency: 'CNY', description: '仓库租金Q1', relatedParty: '北京工业园区管委会', relatedOrderNo: '', accountDate: '2024-03-01', dueDate: '2024-03-05', paymentStatus: 'paid', paidAmount: 45000, operator: '财务张三', notes: '', createdAt: '2024-03-01' },
  ],
  accountsReceivable: [
    { id: 'ar1', arNo: 'AR-2024-001', customerId: 'c1', customerName: '北京科技公司', orderId: 'ord1', orderNo: 'ORD-2024-001', invoiceAmount: 58000, paidAmount: 58000, dueAmount: 0, dueDate: '2024-04-15', status: 'paid', notes: '', createdAt: '2024-03-31' },
    { id: 'ar2', arNo: 'AR-2024-002', customerId: 'c2', customerName: '上海贸易有限公司', orderId: 'ord2', orderNo: 'ORD-2024-002', invoiceAmount: 24800, paidAmount: 10000, dueAmount: 14800, dueDate: '2024-04-18', status: 'partial', notes: '催款中', createdAt: '2024-03-18' },
    { id: 'ar3', arNo: 'AR-2024-003', customerId: 'c3', customerName: '广州零售商', orderId: 'ord3', orderNo: 'ORD-2024-003', invoiceAmount: 15000, paidAmount: 0, dueAmount: 15000, dueDate: '2024-04-01', status: 'overdue', notes: '逾期未付', createdAt: '2024-03-25' },
  ],
  accountsPayable: [
    { id: 'ap1', apNo: 'AP-2024-001', supplierId: 's1', supplierName: '优质电子科技有限公司', purchaseOrderId: 'po1', purchaseOrderNo: 'PO-2024-001', invoiceAmount: 32000, paidAmount: 0, dueAmount: 32000, dueDate: '2024-04-20', status: 'unpaid', notes: '', createdAt: '2024-03-20' },
    { id: 'ap2', apNo: 'AP-2024-002', supplierId: 's2', supplierName: '精品纺织贸易公司', purchaseOrderId: 'po2', purchaseOrderNo: 'PO-2024-002', invoiceAmount: 14000, paidAmount: 14000, dueAmount: 0, dueDate: '2024-03-30', status: 'paid', notes: '', createdAt: '2024-03-15' },
  ],

  departments: [
    { id: 'd1', name: '总经办', managerId: 'e1', managerName: '王总', parentId: '', headcount: 3, budget: 500000, createdAt: '2024-01-01' },
    { id: 'd2', name: '销售部', managerId: 'e2', managerName: '陈经理', parentId: 'd1', headcount: 12, budget: 800000, createdAt: '2024-01-01' },
    { id: 'd3', name: '仓储物流部', managerId: 'e3', managerName: '张伟', parentId: 'd1', headcount: 20, budget: 600000, createdAt: '2024-01-01' },
    { id: 'd4', name: '财务部', managerId: 'e4', managerName: '刘财务', parentId: 'd1', headcount: 6, budget: 400000, createdAt: '2024-01-01' },
    { id: 'd5', name: '技术部', managerId: 'e5', managerName: '李工', parentId: 'd1', headcount: 15, budget: 1200000, createdAt: '2024-01-01' },
  ],
  employees: [
    { id: 'e1', empNo: 'EMP-001', name: '王总', gender: 'male', birthDate: '1975-06-15', idCard: '110101197506150011', phone: '13900000001', email: 'wang@erp.com', departmentId: 'd1', departmentName: '总经办', position: '总经理', hireDate: '2015-01-01', employmentType: 'full_time', baseSalary: 50000, status: 'active', address: '北京市朝阳区', emergencyContact: '王夫人 13900000099', notes: '', createdAt: '2015-01-01' },
    { id: 'e2', empNo: 'EMP-002', name: '陈经理', gender: 'male', birthDate: '1982-03-20', idCard: '110101198203200022', phone: '13900000002', email: 'chen@erp.com', departmentId: 'd2', departmentName: '销售部', position: '销售总监', hireDate: '2018-03-01', employmentType: 'full_time', baseSalary: 28000, status: 'active', address: '北京市海淀区', emergencyContact: '陈妻 13900000098', notes: '', createdAt: '2018-03-01' },
    { id: 'e3', empNo: 'EMP-003', name: '张伟', gender: 'male', birthDate: '1988-11-05', idCard: '110101198811050033', phone: '13800000002', email: 'zhangwei@wms.com', departmentId: 'd3', departmentName: '仓储物流部', position: '仓库经理', hireDate: '2020-01-05', employmentType: 'full_time', baseSalary: 18000, status: 'active', address: '北京市朝阳区', emergencyContact: '张母 13900000097', notes: '', createdAt: '2020-01-05' },
    { id: 'e4', empNo: 'EMP-004', name: '刘财务', gender: 'female', birthDate: '1990-07-18', idCard: '110101199007180044', phone: '13900000004', email: 'liu@erp.com', departmentId: 'd4', departmentName: '财务部', position: '财务经理', hireDate: '2019-06-01', employmentType: 'full_time', baseSalary: 22000, status: 'active', address: '北京市西城区', emergencyContact: '刘夫 13900000096', notes: '', createdAt: '2019-06-01' },
    { id: 'e5', empNo: 'EMP-005', name: '李工', gender: 'male', birthDate: '1992-09-30', idCard: '110101199209300055', phone: '13900000005', email: 'li@erp.com', departmentId: 'd5', departmentName: '技术部', position: '技术总监', hireDate: '2021-03-15', employmentType: 'full_time', baseSalary: 35000, status: 'active', address: '北京市朝阳区', emergencyContact: '李父 13900000095', notes: '', createdAt: '2021-03-15' },
    { id: 'e6', empNo: 'EMP-006', name: '李娜', gender: 'female', birthDate: '1991-04-12', idCard: '310101199104120066', phone: '13800000003', email: 'lina@wms.com', departmentId: 'd3', departmentName: '仓储物流部', position: '仓库经理', hireDate: '2020-02-01', employmentType: 'full_time', baseSalary: 18000, status: 'active', address: '上海市浦东新区', emergencyContact: '李父 13900000094', notes: '', createdAt: '2020-02-01' },
  ],
  attendanceRecords: [
    { id: 'att1', employeeId: 'e3', employeeName: '张伟', departmentName: '仓储物流部', date: '2024-03-25', checkIn: '08:52', checkOut: '18:10', status: 'present', overtimeHours: 0, notes: '' },
    { id: 'att2', employeeId: 'e3', employeeName: '张伟', departmentName: '仓储物流部', date: '2024-03-26', checkIn: '09:15', checkOut: '18:00', status: 'late', overtimeHours: 0, notes: '堵车迟到' },
    { id: 'att3', employeeId: 'e6', employeeName: '李娜', departmentName: '仓储物流部', date: '2024-03-25', checkIn: '08:45', checkOut: '20:00', status: 'present', overtimeHours: 2, notes: '月末盘库加班' },
    { id: 'att4', employeeId: 'e2', employeeName: '陈经理', departmentName: '销售部', date: '2024-03-27', checkIn: '', checkOut: '', status: 'leave', overtimeHours: 0, notes: '年假' },
    { id: 'att5', employeeId: 'e4', employeeName: '刘财务', departmentName: '财务部', date: '2024-03-28', checkIn: '08:30', checkOut: '21:00', status: 'present', overtimeHours: 3, notes: '月结加班' },
  ],
  payrollRecords: [
    { id: 'pay1', payrollNo: 'PAY-2024-03-001', employeeId: 'e3', employeeName: '张伟', departmentName: '仓储物流部', period: '2024-03', baseSalary: 18000, overtimePay: 800, bonus: 2000, deductions: 0, socialInsurance: 2400, tax: 1200, netSalary: 17200, payDate: '2024-04-05', status: 'paid', notes: '', createdAt: '2024-04-01' },
    { id: 'pay2', payrollNo: 'PAY-2024-03-002', employeeId: 'e6', employeeName: '李娜', departmentName: '仓储物流部', period: '2024-03', baseSalary: 18000, overtimePay: 1200, bonus: 2000, deductions: 0, socialInsurance: 2400, tax: 1200, netSalary: 17600, payDate: '2024-04-05', status: 'paid', notes: '', createdAt: '2024-04-01' },
    { id: 'pay3', payrollNo: 'PAY-2024-03-003', employeeId: 'e2', employeeName: '陈经理', departmentName: '销售部', period: '2024-03', baseSalary: 28000, overtimePay: 0, bonus: 8000, deductions: 0, socialInsurance: 3600, tax: 4200, netSalary: 28200, payDate: '2024-04-05', status: 'approved', notes: '含销售提成', createdAt: '2024-04-01' },
  ],

  customers: [
    { id: 'c1', customerNo: 'CUS-001', name: '北京科技公司', type: 'enterprise', industry: '科技', contact: '赵总', phone: '13600000001', email: 'zhao@bjtech.com', address: '北京市海淀区中关村', region: '华北', level: 'A', totalPurchase: 580000, lastPurchaseDate: '2024-03-31', assignedTo: '陈经理', status: 'active', tags: 'VIP,长期客户', notes: '', createdAt: '2022-06-01' },
    { id: 'c2', customerNo: 'CUS-002', name: '上海贸易有限公司', type: 'enterprise', industry: '贸易', contact: '孙经理', phone: '13600000002', email: 'sun@shtrade.com', address: '上海市静安区', region: '华东', level: 'B', totalPurchase: 248000, lastPurchaseDate: '2024-03-18', assignedTo: '陈经理', status: 'active', tags: '贸易商', notes: '', createdAt: '2023-01-15' },
    { id: 'c3', customerNo: 'CUS-003', name: '广州零售商', type: 'enterprise', industry: '零售', contact: '吴老板', phone: '13600000003', email: 'wu@gzretail.com', address: '广州市天河区', region: '华南', level: 'C', totalPurchase: 95000, lastPurchaseDate: '2024-03-25', assignedTo: '王销售', status: 'active', tags: '零售,华南', notes: '', createdAt: '2023-08-01' },
    { id: 'c4', customerNo: 'CUS-004', name: '深圳电子集团', type: 'enterprise', industry: '电子', contact: '郑副总', phone: '13600000004', email: 'zheng@szelec.com', address: '深圳市南山区', region: '华南', level: 'A', totalPurchase: 1260000, lastPurchaseDate: '2024-03-27', assignedTo: '陈经理', status: 'active', tags: 'VIP,战略客户', notes: '年框合同客户', createdAt: '2021-03-01' },
  ],
  opportunities: [
    { id: 'opp1', oppNo: 'OPP-2024-001', title: '深圳电子集团Q2采购', customerId: 'c4', customerName: '深圳电子集团', stage: 'negotiation', amount: 500000, probability: 75, expectedCloseDate: '2024-04-30', assignedTo: '陈经理', source: '老客户续约', products: '电子元件系列', notes: '价格谈判中', createdAt: '2024-03-01', updatedAt: '2024-03-28' },
    { id: 'opp2', oppNo: 'OPP-2024-002', title: '上海新客户开发', customerId: 'c2', customerName: '上海贸易有限公司', stage: 'proposal', amount: 120000, probability: 40, expectedCloseDate: '2024-05-15', assignedTo: '王销售', source: '展会引流', products: '纺织品系列', notes: '已发送报价单', createdAt: '2024-03-10', updatedAt: '2024-03-25' },
    { id: 'opp3', oppNo: 'OPP-2024-003', title: '成都新零售连锁', customerId: '', customerName: '成都优品零售', stage: 'qualified', amount: 280000, probability: 25, expectedCloseDate: '2024-06-30', assignedTo: '陈经理', source: '网络推广', products: '五金工具系列', notes: '初步接触', createdAt: '2024-03-20', updatedAt: '2024-03-20' },
  ],
  contracts: [
    { id: 'con1', contractNo: 'CON-2024-001', title: '深圳电子集团年度框架合同', customerId: 'c4', customerName: '深圳电子集团', type: 'sales', amount: 2000000, startDate: '2024-01-01', endDate: '2024-12-31', status: 'active', signedDate: '2023-12-28', assignedTo: '陈经理', attachments: '', notes: '含保底量条款', createdAt: '2023-12-28' },
    { id: 'con2', contractNo: 'CON-2024-002', title: '北京科技采购合同', customerId: 'c1', customerName: '北京科技公司', type: 'sales', amount: 600000, startDate: '2024-01-15', endDate: '2024-07-15', status: 'active', signedDate: '2024-01-12', assignedTo: '陈经理', attachments: '', notes: '', createdAt: '2024-01-12' },
    { id: 'con3', contractNo: 'CON-2023-018', title: '上海仓库租赁合同', customerId: '', customerName: '上海物流园', type: 'service', amount: 180000, startDate: '2023-06-01', endDate: '2024-05-31', status: 'active', signedDate: '2023-05-25', assignedTo: '王总', attachments: '', notes: '月付15000', createdAt: '2023-05-25' },
  ],

  purchaseRequests: [
    { id: 'pr1', prNo: 'PR-2024-001', departmentId: 'd3', departmentName: '仓储物流部', requestorId: 'e3', requestorName: '张伟', productName: 'USB-C充电线', sku: 'EL-USB-001', quantity: 1000, unit: '根', estimatedPrice: 12.5, totalEstimated: 12500, urgency: 'high', requiredDate: '2024-04-10', reason: '库存告急补货', status: 'approved', approverId: 'e1', approverName: '王总', approvedAt: '2024-03-22', notes: '', createdAt: '2024-03-20' },
    { id: 'pr2', prNo: 'PR-2024-002', departmentId: 'd5', departmentName: '技术部', requestorId: 'e5', requestorName: '李工', productName: '服务器内存条 32GB', sku: 'IT-MEM-032', quantity: 8, unit: '条', estimatedPrice: 850, totalEstimated: 6800, urgency: 'medium', requiredDate: '2024-04-20', reason: '服务器扩容', status: 'pending', approverId: '', approverName: '', approvedAt: '', notes: '等待审批', createdAt: '2024-03-25' },
    { id: 'pr3', prNo: 'PR-2024-003', departmentId: 'd2', departmentName: '销售部', requestorId: 'e2', requestorName: '陈经理', productName: '展会宣传物料', sku: 'MKT-PRT-001', quantity: 500, unit: '套', estimatedPrice: 35, totalEstimated: 17500, urgency: 'urgent', requiredDate: '2024-04-05', reason: '广交会参展', status: 'approved', approverId: 'e1', approverName: '王总', approvedAt: '2024-03-26', notes: '', createdAt: '2024-03-24' },
  ],
  purchaseOrders: [
    { id: 'po1', poNo: 'PO-2024-001', supplierId: 's1', supplierName: '优质电子科技有限公司', warehouseId: 'w1', warehouseName: '北京主仓', items: [{ id: 'poi1', productName: 'USB-C充电线', sku: 'EL-USB-001', quantity: 1000, unit: '根', unitPrice: 12.5, totalPrice: 12500, receivedQty: 0 }, { id: 'poi2', productName: '无线蓝牙耳机', sku: 'EL-BT-002', quantity: 100, unit: '个', unitPrice: 89, totalPrice: 8900, receivedQty: 0 }], totalAmount: 21400, currency: 'CNY', expectedDate: '2024-04-10', receivedDate: '', paymentTerms: '30天账期', status: 'approved', operator: '采购王', notes: '', createdAt: '2024-03-22' },
    { id: 'po2', poNo: 'PO-2024-002', supplierId: 's2', supplierName: '精品纺织贸易公司', warehouseId: 'w2', warehouseName: '上海分仓', items: [{ id: 'poi3', productName: '纯棉T恤（白色L）', sku: 'TX-TSHIRT-003', quantity: 400, unit: '件', unitPrice: 35, totalPrice: 14000, receivedQty: 400 }], totalAmount: 14000, currency: 'CNY', expectedDate: '2024-03-20', receivedDate: '2024-03-19', paymentTerms: '货到付款', status: 'received', operator: '采购王', notes: '', createdAt: '2024-03-15' },
  ],

  productionPlans: [
    { id: 'pp1', planNo: 'PLAN-2024-001', productName: '智能充电套装', sku: 'KIT-CHARGE-001', plannedQty: 500, completedQty: 320, unit: '套', warehouseId: 'w1', warehouseName: '北京主仓', startDate: '2024-03-01', endDate: '2024-03-31', priority: 'high', status: 'in_progress', bom: [{ id: 'bom1', materialName: 'USB-C充电线', sku: 'EL-USB-001', quantity: 1, unit: '根', unitCost: 12.5, totalCost: 12.5 }, { id: 'bom2', materialName: '移动电源20000mAh', sku: 'EL-PWR-005', quantity: 1, unit: '个', unitCost: 89, totalCost: 89 }], notes: '主力产品套装组装', createdAt: '2024-02-25' },
    { id: 'pp2', planNo: 'PLAN-2024-002', productName: '五金工具礼盒', sku: 'KIT-HW-002', plannedQty: 200, completedQty: 200, unit: '盒', warehouseId: 'w3', warehouseName: '广州南仓', startDate: '2024-03-10', endDate: '2024-03-25', priority: 'medium', status: 'completed', bom: [{ id: 'bom3', materialName: '不锈钢螺丝套装', sku: 'HW-SCREW-004', quantity: 2, unit: '套', unitCost: 25, totalCost: 50 }], notes: '', createdAt: '2024-03-08' },
  ],
  workOrders: [
    { id: 'wo1', woNo: 'WO-2024-001', planId: 'pp1', planNo: 'PLAN-2024-001', productName: '智能充电套装', sku: 'KIT-CHARGE-001', targetQty: 200, completedQty: 200, unit: '套', assignedTo: '生产组A', workStation: '组装车间1', startDate: '2024-03-01', endDate: '2024-03-15', actualStart: '2024-03-01', actualEnd: '2024-03-14', status: 'completed', qualityRate: 98.5, notes: '', createdAt: '2024-02-28' },
    { id: 'wo2', woNo: 'WO-2024-002', planId: 'pp1', planNo: 'PLAN-2024-001', productName: '智能充电套装', sku: 'KIT-CHARGE-001', targetQty: 300, completedQty: 120, unit: '套', assignedTo: '生产组B', workStation: '组装车间2', startDate: '2024-03-15', endDate: '2024-03-31', actualStart: '2024-03-15', actualEnd: '', status: 'in_progress', qualityRate: 97.2, notes: '进行中', createdAt: '2024-03-14' },
    { id: 'wo3', woNo: 'WO-2024-003', planId: 'pp2', planNo: 'PLAN-2024-002', productName: '五金工具礼盒', sku: 'KIT-HW-002', targetQty: 200, completedQty: 200, unit: '盒', assignedTo: '生产组C', workStation: '包装车间', startDate: '2024-03-10', endDate: '2024-03-25', actualStart: '2024-03-10', actualEnd: '2024-03-24', status: 'completed', qualityRate: 99.5, notes: '', createdAt: '2024-03-09' },
  ],
});

// ─── ERP Store ────────────────────────────────────────────────────────────────
class ERPStore {
  private state: ERPState;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { this.state = JSON.parse(saved); }
      catch { this.state = seedERPData(); }
    } else {
      this.state = seedERPData();
      this.save();
    }
  }

  private save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }
  getState(): ERPState { return this.state; }
  resetData() { this.state = seedERPData(); this.save(); }

  // ── 财务 ──
  addFinanceRecord(data: Omit<FinanceRecord, 'id' | 'recordNo' | 'createdAt'>): FinanceRecord {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.financeRecords.length + 1;
    const item: FinanceRecord = { ...s, id: generateId(), recordNo: `FIN-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.financeRecords.push(item); this.save(); return item;
  }
  updateFinanceRecord(id: string, data: Partial<FinanceRecord>) {
    const idx = this.state.financeRecords.findIndex(r => r.id === id);
    if (idx >= 0) { this.state.financeRecords[idx] = { ...this.state.financeRecords[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteFinanceRecord(id: string) { this.state.financeRecords = this.state.financeRecords.filter(r => r.id !== id); this.save(); }

  addAR(data: Omit<AccountsReceivable, 'id' | 'arNo' | 'createdAt'>): AccountsReceivable {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.accountsReceivable.length + 1;
    const item: AccountsReceivable = { ...s, id: generateId(), arNo: `AR-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.accountsReceivable.push(item); this.save(); return item;
  }
  updateAR(id: string, data: Partial<AccountsReceivable>) {
    const idx = this.state.accountsReceivable.findIndex(r => r.id === id);
    if (idx >= 0) { this.state.accountsReceivable[idx] = { ...this.state.accountsReceivable[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteAR(id: string) { this.state.accountsReceivable = this.state.accountsReceivable.filter(r => r.id !== id); this.save(); }

  addAP(data: Omit<AccountsPayable, 'id' | 'apNo' | 'createdAt'>): AccountsPayable {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.accountsPayable.length + 1;
    const item: AccountsPayable = { ...s, id: generateId(), apNo: `AP-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.accountsPayable.push(item); this.save(); return item;
  }
  updateAP(id: string, data: Partial<AccountsPayable>) {
    const idx = this.state.accountsPayable.findIndex(r => r.id === id);
    if (idx >= 0) { this.state.accountsPayable[idx] = { ...this.state.accountsPayable[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteAP(id: string) { this.state.accountsPayable = this.state.accountsPayable.filter(r => r.id !== id); this.save(); }

  // ── HR ──
  addDepartment(data: Omit<Department, 'id' | 'createdAt'>): Department {
    const item: Department = { ...sanitizeForStorage(data) as typeof data, id: generateId(), createdAt: now() };
    this.state.departments.push(item); this.save(); return item;
  }
  updateDepartment(id: string, data: Partial<Department>) {
    const idx = this.state.departments.findIndex(d => d.id === id);
    if (idx >= 0) { this.state.departments[idx] = { ...this.state.departments[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteDepartment(id: string) { this.state.departments = this.state.departments.filter(d => d.id !== id); this.save(); }

  addEmployee(data: Omit<Employee, 'id' | 'empNo' | 'createdAt'>): Employee {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.employees.length + 1;
    const item: Employee = { ...s, id: generateId(), empNo: `EMP-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.employees.push(item); this.save(); return item;
  }
  updateEmployee(id: string, data: Partial<Employee>) {
    const idx = this.state.employees.findIndex(e => e.id === id);
    if (idx >= 0) { this.state.employees[idx] = { ...this.state.employees[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteEmployee(id: string) { this.state.employees = this.state.employees.filter(e => e.id !== id); this.save(); }

  addAttendance(data: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const item: AttendanceRecord = { ...sanitizeForStorage(data) as typeof data, id: generateId() };
    this.state.attendanceRecords.push(item); this.save(); return item;
  }
  updateAttendance(id: string, data: Partial<AttendanceRecord>) {
    const idx = this.state.attendanceRecords.findIndex(a => a.id === id);
    if (idx >= 0) { this.state.attendanceRecords[idx] = { ...this.state.attendanceRecords[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteAttendance(id: string) { this.state.attendanceRecords = this.state.attendanceRecords.filter(a => a.id !== id); this.save(); }

  addPayroll(data: Omit<PayrollRecord, 'id' | 'payrollNo' | 'createdAt'>): PayrollRecord {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.payrollRecords.length + 1;
    const item: PayrollRecord = { ...s, id: generateId(), payrollNo: `PAY-${s.period}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.payrollRecords.push(item); this.save(); return item;
  }
  updatePayroll(id: string, data: Partial<PayrollRecord>) {
    const idx = this.state.payrollRecords.findIndex(p => p.id === id);
    if (idx >= 0) { this.state.payrollRecords[idx] = { ...this.state.payrollRecords[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deletePayroll(id: string) { this.state.payrollRecords = this.state.payrollRecords.filter(p => p.id !== id); this.save(); }

  // ── CRM ──
  addCustomer(data: Omit<Customer, 'id' | 'customerNo' | 'createdAt'>): Customer {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.customers.length + 1;
    const item: Customer = { ...s, id: generateId(), customerNo: `CUS-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.customers.push(item); this.save(); return item;
  }
  updateCustomer(id: string, data: Partial<Customer>) {
    const idx = this.state.customers.findIndex(c => c.id === id);
    if (idx >= 0) { this.state.customers[idx] = { ...this.state.customers[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteCustomer(id: string) { this.state.customers = this.state.customers.filter(c => c.id !== id); this.save(); }

  addOpportunity(data: Omit<Opportunity, 'id' | 'oppNo' | 'createdAt' | 'updatedAt'>): Opportunity {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.opportunities.length + 1;
    const item: Opportunity = { ...s, id: generateId(), oppNo: `OPP-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now(), updatedAt: now() };
    this.state.opportunities.push(item); this.save(); return item;
  }
  updateOpportunity(id: string, data: Partial<Opportunity>) {
    const idx = this.state.opportunities.findIndex(o => o.id === id);
    if (idx >= 0) { this.state.opportunities[idx] = { ...this.state.opportunities[idx], ...sanitizeForStorage(data), updatedAt: now() }; this.save(); }
  }
  deleteOpportunity(id: string) { this.state.opportunities = this.state.opportunities.filter(o => o.id !== id); this.save(); }

  addContract(data: Omit<Contract, 'id' | 'contractNo' | 'createdAt'>): Contract {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.contracts.length + 1;
    const item: Contract = { ...s, id: generateId(), contractNo: `CON-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.contracts.push(item); this.save(); return item;
  }
  updateContract(id: string, data: Partial<Contract>) {
    const idx = this.state.contracts.findIndex(c => c.id === id);
    if (idx >= 0) { this.state.contracts[idx] = { ...this.state.contracts[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteContract(id: string) { this.state.contracts = this.state.contracts.filter(c => c.id !== id); this.save(); }

  // ── 采购 ──
  addPurchaseRequest(data: Omit<PurchaseRequest, 'id' | 'prNo' | 'createdAt'>): PurchaseRequest {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.purchaseRequests.length + 1;
    const item: PurchaseRequest = { ...s, id: generateId(), prNo: `PR-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.purchaseRequests.push(item); this.save(); return item;
  }
  updatePurchaseRequest(id: string, data: Partial<PurchaseRequest>) {
    const idx = this.state.purchaseRequests.findIndex(r => r.id === id);
    if (idx >= 0) { this.state.purchaseRequests[idx] = { ...this.state.purchaseRequests[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deletePurchaseRequest(id: string) { this.state.purchaseRequests = this.state.purchaseRequests.filter(r => r.id !== id); this.save(); }

  addPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'poNo' | 'createdAt'>): PurchaseOrder {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.purchaseOrders.length + 1;
    const item: PurchaseOrder = { ...s, id: generateId(), poNo: `PO-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.purchaseOrders.push(item); this.save(); return item;
  }
  updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>) {
    const idx = this.state.purchaseOrders.findIndex(o => o.id === id);
    if (idx >= 0) { this.state.purchaseOrders[idx] = { ...this.state.purchaseOrders[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deletePurchaseOrder(id: string) { this.state.purchaseOrders = this.state.purchaseOrders.filter(o => o.id !== id); this.save(); }

  // ── 生产 ──
  addProductionPlan(data: Omit<ProductionPlan, 'id' | 'planNo' | 'createdAt'>): ProductionPlan {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.productionPlans.length + 1;
    const item: ProductionPlan = { ...s, id: generateId(), planNo: `PLAN-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.productionPlans.push(item); this.save(); return item;
  }
  updateProductionPlan(id: string, data: Partial<ProductionPlan>) {
    const idx = this.state.productionPlans.findIndex(p => p.id === id);
    if (idx >= 0) { this.state.productionPlans[idx] = { ...this.state.productionPlans[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteProductionPlan(id: string) { this.state.productionPlans = this.state.productionPlans.filter(p => p.id !== id); this.save(); }

  addWorkOrder(data: Omit<WorkOrder, 'id' | 'woNo' | 'createdAt'>): WorkOrder {
    const s = sanitizeForStorage(data) as typeof data;
    const count = this.state.workOrders.length + 1;
    const item: WorkOrder = { ...s, id: generateId(), woNo: `WO-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.workOrders.push(item); this.save(); return item;
  }
  updateWorkOrder(id: string, data: Partial<WorkOrder>) {
    const idx = this.state.workOrders.findIndex(w => w.id === id);
    if (idx >= 0) { this.state.workOrders[idx] = { ...this.state.workOrders[idx], ...sanitizeForStorage(data) }; this.save(); }
  }
  deleteWorkOrder(id: string) { this.state.workOrders = this.state.workOrders.filter(w => w.id !== id); this.save(); }
}

export const erpStore = new ERPStore();
export { thisMonth };
