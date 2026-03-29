import { AppState, Warehouse, Supplier, InventoryItem, InboundRecord, OutboundRecord, Order, User } from '../types';
import { checkRateLimit, sanitizeForStorage } from '../utils/security';

const STORAGE_KEY = 'wms_data';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const now = () => new Date().toISOString().split('T')[0];

// Seed demo data
const seedData = (): AppState => ({
  currentUser: null,
  warehouses: [
    { id: 'w1', name: '北京主仓', location: '北京市朝阳区工业园区A栋', manager: '张伟', capacity: 10000, usedCapacity: 6500, status: 'active', contactPhone: '010-12345678', notes: '主力仓库', createdAt: '2024-01-01' },
    { id: 'w2', name: '上海分仓', location: '上海市浦东新区物流园B区', manager: '李娜', capacity: 8000, usedCapacity: 4200, status: 'active', contactPhone: '021-87654321', notes: '华东区域仓库', createdAt: '2024-02-01' },
    { id: 'w3', name: '广州南仓', location: '广州市番禺区物流中心', manager: '王强', capacity: 6000, usedCapacity: 1800, status: 'active', contactPhone: '020-11223344', notes: '华南区域仓库', createdAt: '2024-03-01' },
  ],
  suppliers: [
    { id: 's1', name: '优质电子科技有限公司', contact: '陈总', phone: '13800138001', email: 'chen@electronics.com', address: '深圳市龙岗区', category: '电子元件', status: 'active', createdAt: '2024-01-10' },
    { id: 's2', name: '精品纺织贸易公司', contact: '刘经理', phone: '13900139002', email: 'liu@textile.com', address: '杭州市余杭区', category: '纺织品', status: 'active', createdAt: '2024-01-15' },
    { id: 's3', name: '宏达五金制品厂', contact: '赵厂长', phone: '13700137003', email: 'zhao@hardware.com', address: '苏州市工业园区', category: '五金工具', status: 'active', createdAt: '2024-02-05' },
  ],
  inventory: [
    { id: 'i1', productId: 'p1', productName: 'USB-C 充电线', sku: 'EL-USB-001', warehouseId: 'w1', warehouseName: '北京主仓', quantity: 1500, minStock: 200, maxStock: 3000, unit: '根', category: '电子配件', supplierId: 's1', supplierName: '优质电子科技有限公司', lastUpdated: now() },
    { id: 'i2', productId: 'p2', productName: '无线蓝牙耳机', sku: 'EL-BT-002', warehouseId: 'w1', warehouseName: '北京主仓', quantity: 80, minStock: 100, maxStock: 500, unit: '个', category: '电子产品', supplierId: 's1', supplierName: '优质电子科技有限公司', lastUpdated: now() },
    { id: 'i3', productId: 'p3', productName: '纯棉T恤（白色L）', sku: 'TX-TSHIRT-003', warehouseId: 'w2', warehouseName: '上海分仓', quantity: 320, minStock: 50, maxStock: 800, unit: '件', category: '服装', supplierId: 's2', supplierName: '精品纺织贸易公司', lastUpdated: now() },
    { id: 'i4', productId: 'p4', productName: '不锈钢螺丝套装', sku: 'HW-SCREW-004', warehouseId: 'w3', warehouseName: '广州南仓', quantity: 2200, minStock: 500, maxStock: 5000, unit: '套', category: '五金工具', supplierId: 's3', supplierName: '宏达五金制品厂', lastUpdated: now() },
    { id: 'i5', productId: 'p5', productName: '移动电源 20000mAh', sku: 'EL-PWR-005', warehouseId: 'w2', warehouseName: '上海分仓', quantity: 45, minStock: 100, maxStock: 600, unit: '个', category: '电子产品', supplierId: 's1', supplierName: '优质电子科技有限公司', lastUpdated: now() },
  ],
  inbound: [
    { id: 'ib1', orderNo: 'IN-2024-001', warehouseId: 'w1', warehouseName: '北京主仓', supplierId: 's1', supplierName: '优质电子科技有限公司', productId: 'p1', productName: 'USB-C 充电线', sku: 'EL-USB-001', quantity: 500, unitPrice: 12.5, totalAmount: 6250, operator: '张伟', inboundDate: '2024-03-10', status: 'completed', notes: '' },
    { id: 'ib2', orderNo: 'IN-2024-002', warehouseId: 'w2', warehouseName: '上海分仓', supplierId: 's2', supplierName: '精品纺织贸易公司', productId: 'p3', productName: '纯棉T恤（白色L）', sku: 'TX-TSHIRT-003', quantity: 200, unitPrice: 35, totalAmount: 7000, operator: '李娜', inboundDate: '2024-03-15', status: 'completed', notes: '' },
    { id: 'ib3', orderNo: 'IN-2024-003', warehouseId: 'w1', warehouseName: '北京主仓', supplierId: 's1', supplierName: '优质电子科技有限公司', productId: 'p2', productName: '无线蓝牙耳机', sku: 'EL-BT-002', quantity: 50, unitPrice: 89, totalAmount: 4450, operator: '张伟', inboundDate: '2024-03-20', status: 'pending', notes: '待质检' },
  ],
  outbound: [
    { id: 'ob1', orderNo: 'OUT-2024-001', warehouseId: 'w1', warehouseName: '北京主仓', destination: '北京市海淀区客户A', productId: 'p1', productName: 'USB-C 充电线', sku: 'EL-USB-001', quantity: 100, operator: '张伟', outboundDate: '2024-03-12', status: 'completed', reason: '销售出库', notes: '' },
    { id: 'ob2', orderNo: 'OUT-2024-002', warehouseId: 'w2', warehouseName: '上海分仓', destination: '上海市静安区客户B', productId: 'p3', productName: '纯棉T恤（白色L）', sku: 'TX-TSHIRT-003', quantity: 80, operator: '李娜', outboundDate: '2024-03-18', status: 'completed', reason: '销售出库', notes: '' },
  ],
  orders: [
    { id: 'ord1', orderNo: 'ORD-2024-001', customer: '北京科技公司', products: 'USB-C 充电线 x100', totalAmount: 1800, status: 'completed', warehouseId: 'w1', warehouseName: '北京主仓', createdAt: '2024-03-12', notes: '' },
    { id: 'ord2', orderNo: 'ORD-2024-002', customer: '上海贸易有限公司', products: '纯棉T恤 x80', totalAmount: 4800, status: 'shipped', warehouseId: 'w2', warehouseName: '上海分仓', createdAt: '2024-03-18', notes: '' },
    { id: 'ord3', orderNo: 'ORD-2024-003', customer: '广州零售商', products: '不锈钢螺丝套装 x50', totalAmount: 1500, status: 'processing', warehouseId: 'w3', warehouseName: '广州南仓', createdAt: '2024-03-25', notes: '加急' },
    { id: 'ord4', orderNo: 'ORD-2024-004', customer: '深圳电子集团', products: '无线蓝牙耳机 x20', totalAmount: 3560, status: 'pending', warehouseId: 'w1', warehouseName: '北京主仓', createdAt: '2024-03-27', notes: '' },
  ],
  users: [
    { id: 'u1', username: 'admin', name: '系统管理员', role: 'admin', email: 'admin@wms.com', phone: '13800000001', warehouseId: '', warehouseName: '全部', status: 'active', lastLogin: now(), createdAt: '2024-01-01' },
    { id: 'u2', username: 'zhangwei', name: '张伟', role: 'manager', email: 'zhangwei@wms.com', phone: '13800000002', warehouseId: 'w1', warehouseName: '北京主仓', status: 'active', lastLogin: now(), createdAt: '2024-01-05' },
    { id: 'u3', username: 'lina', name: '李娜', role: 'manager', email: 'lina@wms.com', phone: '13800000003', warehouseId: 'w2', warehouseName: '上海分仓', status: 'active', lastLogin: '2024-03-26', createdAt: '2024-02-01' },
    { id: 'u4', username: 'wangqiang', name: '王强', role: 'operator', email: 'wangqiang@wms.com', phone: '13800000004', warehouseId: 'w3', warehouseName: '广州南仓', status: 'active', lastLogin: '2024-03-25', createdAt: '2024-03-01' },
    { id: 'u5', username: 'viewer1', name: '报表查看员', role: 'viewer', email: 'viewer@wms.com', phone: '13800000005', warehouseId: '', warehouseName: '全部', status: 'active', lastLogin: '2024-03-20', createdAt: '2024-03-10' },
  ],
});

class Store {
  private state: AppState;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        // Ensure currentUser is null on load (require login)
        this.state.currentUser = null;
      } catch {
        this.state = seedData();
      }
    } else {
      this.state = seedData();
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  getState(): AppState { return this.state; }

  // Auth
  login(username: string, password: string): { user: User | null; rateLimited?: boolean } {
    // Check rate limit: 5 times per minute per username
    if (!checkRateLimit(`login:${username}`, 5, 60000)) {
      return { user: null, rateLimited: true };
    }

    const user = this.state.users.find(u => u.username === username && u.status === 'active');
    if (!user) return { user: null };

    // Demo: password is always '123456' or username for simplicity
    if (password !== '123456' && password !== username) return { user: null };
    
    this.state.currentUser = user;
    user.lastLogin = now();
    this.save();
    return { user };
  }

  isRateLimited(username: string): boolean {
    // Internal helper to check if UI should show a wait message
    return !checkRateLimit(`login:${username}`, 5, 60000);
  }

  logout() {
    this.state.currentUser = null;
    this.save();
  }

  // Generic CRUD
  addWarehouse(data: Omit<Warehouse, 'id' | 'createdAt' | 'usedCapacity'>): Warehouse {
    const sanitized = sanitizeForStorage(data);
    const item: Warehouse = { ...sanitized, id: generateId(), usedCapacity: 0, createdAt: now() };
    this.state.warehouses.push(item);
    this.save();
    return item;
  }

  updateWarehouse(id: string, data: Partial<Warehouse>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.warehouses.findIndex(w => w.id === id);
    if (idx >= 0) { this.state.warehouses[idx] = { ...this.state.warehouses[idx], ...sanitized }; this.save(); }
  }

  deleteWarehouse(id: string): void {
    this.state.warehouses = this.state.warehouses.filter(w => w.id !== id);
    this.save();
  }

  addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const sanitized = sanitizeForStorage(data);
    const item: Supplier = { ...sanitized, id: generateId(), createdAt: now() };
    this.state.suppliers.push(item);
    this.save();
    return item;
  }

  updateSupplier(id: string, data: Partial<Supplier>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.suppliers.findIndex(s => s.id === id);
    if (idx >= 0) { this.state.suppliers[idx] = { ...this.state.suppliers[idx], ...sanitized }; this.save(); }
  }

  deleteSupplier(id: string): void {
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this.save();
  }

  addInventory(data: Omit<InventoryItem, 'id' | 'lastUpdated'>): InventoryItem {
    const sanitized = sanitizeForStorage(data);
    const item: InventoryItem = { ...sanitized, id: generateId(), lastUpdated: now() };
    this.state.inventory.push(item);
    this.save();
    return item;
  }

  updateInventory(id: string, data: Partial<InventoryItem>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.inventory.findIndex(i => i.id === id);
    if (idx >= 0) { this.state.inventory[idx] = { ...this.state.inventory[idx], ...sanitized, lastUpdated: now() }; this.save(); }
  }

  deleteInventory(id: string): void {
    this.state.inventory = this.state.inventory.filter(i => i.id !== id);
    this.save();
  }

  addInbound(data: Omit<InboundRecord, 'id' | 'orderNo'>): InboundRecord {
    const sanitized = sanitizeForStorage(data);
    const count = this.state.inbound.length + 1;
    const item: InboundRecord = { ...sanitized, id: generateId(), orderNo: `IN-${new Date().getFullYear()}-${String(count).padStart(3,'0')}` };
    this.state.inbound.push(item);
    // Update inventory
    if (data.status === 'completed') {
      const inv = this.state.inventory.find(i => i.productId === data.productId && i.warehouseId === data.warehouseId);
      if (inv) this.updateInventory(inv.id, { quantity: inv.quantity + data.quantity });
    }
    this.save();
    return item;
  }

  updateInbound(id: string, data: Partial<InboundRecord>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.inbound.findIndex(i => i.id === id);
    if (idx >= 0) { this.state.inbound[idx] = { ...this.state.inbound[idx], ...sanitized }; this.save(); }
  }

  deleteInbound(id: string): void {
    this.state.inbound = this.state.inbound.filter(i => i.id !== id);
    this.save();
  }

  addOutbound(data: Omit<OutboundRecord, 'id' | 'orderNo'>): OutboundRecord {
    const sanitized = sanitizeForStorage(data);
    const count = this.state.outbound.length + 1;
    const item: OutboundRecord = { ...sanitized, id: generateId(), orderNo: `OUT-${new Date().getFullYear()}-${String(count).padStart(3,'0')}` };
    this.state.outbound.push(item);
    if (data.status === 'completed') {
      const inv = this.state.inventory.find(i => i.productId === data.productId && i.warehouseId === data.warehouseId);
      if (inv) this.updateInventory(inv.id, { quantity: Math.max(0, inv.quantity - data.quantity) });
    }
    this.save();
    return item;
  }

  updateOutbound(id: string, data: Partial<OutboundRecord>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.outbound.findIndex(i => i.id === id);
    if (idx >= 0) { this.state.outbound[idx] = { ...this.state.outbound[idx], ...sanitized }; this.save(); }
  }

  deleteOutbound(id: string): void {
    this.state.outbound = this.state.outbound.filter(i => i.id !== id);
    this.save();
  }

  addOrder(data: Omit<Order, 'id' | 'orderNo' | 'createdAt'>): Order {
    const sanitized = sanitizeForStorage(data);
    const count = this.state.orders.length + 1;
    const item: Order = { ...sanitized, id: generateId(), orderNo: `ORD-${new Date().getFullYear()}-${String(count).padStart(3,'0')}`, createdAt: now() };
    this.state.orders.push(item);
    this.save();
    return item;
  }

  updateOrder(id: string, data: Partial<Order>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.orders.findIndex(o => o.id === id);
    if (idx >= 0) { this.state.orders[idx] = { ...this.state.orders[idx], ...sanitized }; this.save(); }
  }

  deleteOrder(id: string): void {
    this.state.orders = this.state.orders.filter(o => o.id !== id);
    this.save();
  }

  addUser(data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): User {
    const sanitized = sanitizeForStorage(data);
    const item: User = { ...sanitized, id: generateId(), createdAt: now(), lastLogin: '-' };
    this.state.users.push(item);
    this.save();
    return item;
  }

  updateUser(id: string, data: Partial<User>): void {
    const sanitized = sanitizeForStorage(data);
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx >= 0) { this.state.users[idx] = { ...this.state.users[idx], ...sanitized }; this.save(); }
  }

  deleteUser(id: string): void {
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.save();
  }

  exportData(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importData(json: string): void {
    try {
      const data = JSON.parse(json);
      // Basic schema validation
      const requiredKeys: (keyof AppState)[] = ['warehouses', 'suppliers', 'inventory', 'inbound', 'outbound', 'orders', 'users'];
      for (const key of requiredKeys) {
        if (!Array.isArray(data[key])) {
          throw new Error(`Invalid data format: ${key} is missing or not an array`);
        }
      }
      this.state = { ...data, currentUser: null };
      this.save();
    } catch (e) {
      console.error('Import failed:', e);
      throw new Error('导入失败: 格式错误');
    }
  }

  resetData(): void {
    this.state = seedData();
    this.save();
  }
}

export const store = new Store();
export { generateId };
