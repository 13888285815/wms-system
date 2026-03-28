export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
export type StatusActive = 'active' | 'inactive';
export type OrderStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'processing' | 'shipped';
export type StockStatus = 'normal' | 'low' | 'overstock';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  usedCapacity: number;
  status: StatusActive;
  contactPhone: string;
  notes: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  status: StatusActive;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  supplierId: string;
  minStock: number;
  maxStock: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  category: string;
  supplierId: string;
  supplierName: string;
  lastUpdated: string;
}

export interface InboundRecord {
  id: string;
  orderNo: string;
  warehouseId: string;
  warehouseName: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  operator: string;
  inboundDate: string;
  status: OrderStatus;
  notes: string;
}

export interface OutboundRecord {
  id: string;
  orderNo: string;
  warehouseId: string;
  warehouseName: string;
  destination: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  operator: string;
  outboundDate: string;
  status: OrderStatus;
  reason: string;
  notes: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customer: string;
  products: string;
  totalAmount: number;
  status: OrderStatus;
  warehouseId: string;
  warehouseName: string;
  createdAt: string;
  notes: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  warehouseId: string;
  warehouseName: string;
  status: StatusActive;
  lastLogin: string;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  warehouses: Warehouse[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  inbound: InboundRecord[];
  outbound: OutboundRecord[];
  orders: Order[];
  users: User[];
}
