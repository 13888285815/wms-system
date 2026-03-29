import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ClipboardList, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, Package, Truck, 
  User, Building2, Calendar, FileText, Star,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { erpStore } from '../../store/erp';
import { store } from '../../store';
import { useRefresh } from '../../store/reactive';
import { 
  PurchaseRequest, PurchaseOrder, ApprovalStatus, 
  PurchaseOrderItem 
} from '../../types/erp';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

const PurchasePage: React.FC = () => {
  const refresh = useRefresh();
  const [activeTab, setActiveTab] = useState<'request' | 'order' | 'supplier'>('request');
  
  // States for Purchase Request
  const [prSearch, setPrSearch] = useState('');
  const [prStatusFilter, setPrStatusFilter] = useState<string>('all');
  const [prUrgencyFilter, setPrUrgencyFilter] = useState<string>('all');
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequest | null>(null);

  // States for Purchase Order
  const [poSearch, setPoSearch] = useState('');
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  const erpData = useMemo(() => erpStore.getState(), [refresh]);
  const wmsData = useMemo(() => store.getState(), [refresh]);

  const suppliers = wmsData.suppliers;
  const warehouses = wmsData.warehouses;

  // --- Purchase Request Handlers ---
  const initialPrForm: Omit<PurchaseRequest, 'id' | 'prNo' | 'createdAt'> = {
    departmentId: '',
    departmentName: '',
    requestorId: '',
    requestorName: '',
    productName: '',
    sku: '',
    quantity: 0,
    unit: '',
    estimatedPrice: 0,
    totalEstimated: 0,
    urgency: 'low',
    requiredDate: '',
    reason: '',
    status: 'pending',
    approverId: '',
    approverName: '',
    approvedAt: '',
    notes: '',
  };

  const [prFormData, setPrFormData] = useState(initialPrForm);

  const filteredPrs = useMemo(() => {
    return erpData.purchaseRequests.filter(pr => {
      const matchesSearch = pr.prNo.toLowerCase().includes(prSearch.toLowerCase()) || 
                          pr.productName.toLowerCase().includes(prSearch.toLowerCase());
      const matchesStatus = prStatusFilter === 'all' || pr.status === prStatusFilter;
      const matchesUrgency = prUrgencyFilter === 'all' || pr.urgency === prUrgencyFilter;
      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [erpData.purchaseRequests, prSearch, prStatusFilter, prUrgencyFilter]);

  const prStats = useMemo(() => {
    return {
      total: erpData.purchaseRequests.length,
      pending: erpData.purchaseRequests.filter(r => r.status === 'pending').length,
      approved: erpData.purchaseRequests.filter(r => r.status === 'approved').length,
      urgent: erpData.purchaseRequests.filter(r => r.urgency === 'urgent').length,
    };
  }, [erpData.purchaseRequests]);

  const handleOpenPrModal = (pr?: PurchaseRequest) => {
    if (pr) {
      setEditingPr(pr);
      setPrFormData({ ...pr });
    } else {
      setEditingPr(null);
      setPrFormData(initialPrForm);
    }
    setIsPrModalOpen(true);
  };

  const handlePrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...prFormData, totalEstimated: prFormData.quantity * prFormData.estimatedPrice };
    if (editingPr) {
      erpStore.updatePurchaseRequest(editingPr.id, data);
    } else {
      erpStore.addPurchaseRequest(data);
    }
    refresh();
    setIsPrModalOpen(false);
  };

  // --- Purchase Order Handlers ---
  const initialPoForm: Omit<PurchaseOrder, 'id' | 'poNo' | 'createdAt'> = {
    supplierId: '',
    supplierName: '',
    warehouseId: '',
    warehouseName: '',
    items: [],
    totalAmount: 0,
    currency: 'CNY',
    expectedDate: '',
    receivedDate: '',
    paymentTerms: '',
    status: 'pending',
    operator: '',
    notes: '',
  };

  const [poFormData, setPoFormData] = useState(initialPoForm);
  // Simplified item for Modal
  const [poItem, setPoItem] = useState({
    productName: '',
    sku: '',
    quantity: 0,
    unit: '',
    unitPrice: 0,
  });

  const filteredPos = useMemo(() => {
    return erpData.purchaseOrders.filter(po => 
      po.poNo.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(poSearch.toLowerCase())
    );
  }, [erpData.purchaseOrders, poSearch]);

  const poStats = useMemo(() => {
    return {
      total: erpData.purchaseOrders.length,
      pending: erpData.purchaseOrders.filter(o => o.status === 'pending').length,
      received: erpData.purchaseOrders.filter(o => o.status === 'received').length,
      thisMonthTotal: erpData.purchaseOrders
        .filter(o => o.createdAt.startsWith(new Date().toISOString().substring(0, 7)))
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }, [erpData.purchaseOrders]);

  const handleOpenPoModal = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPo(po);
      setPoFormData({ ...po });
      if (po.items.length > 0) {
        setPoItem({
          productName: po.items[0].productName,
          sku: po.items[0].sku,
          quantity: po.items[0].quantity,
          unit: po.items[0].unit,
          unitPrice: po.items[0].unitPrice,
        });
      }
    } else {
      setEditingPo(null);
      setPoFormData(initialPoForm);
      setPoItem({ productName: '', sku: '', quantity: 0, unit: '', unitPrice: 0 });
    }
    setIsPoModalOpen(true);
  };

  const handlePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = poItem.quantity * poItem.unitPrice;
    const items: PurchaseOrderItem[] = [{
      id: Math.random().toString(36).substr(2, 9),
      productName: poItem.productName,
      sku: poItem.sku,
      quantity: poItem.quantity,
      unit: poItem.unit,
      unitPrice: poItem.unitPrice,
      totalPrice: totalPrice,
      receivedQty: 0
    }];

    const data = { ...poFormData, items, totalAmount: totalPrice };
    if (editingPo) {
      erpStore.updatePurchaseOrder(editingPo.id, data);
    } else {
      erpStore.addPurchaseOrder(data);
    }
    refresh();
    setIsPoModalOpen(false);
  };

  // --- Supplier Evaluation ---
  const supplierStats = useMemo(() => {
    return suppliers.map(s => {
      const orders = erpData.purchaseOrders.filter(o => o.supplierId === s.id);
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const receivedCount = orders.filter(o => o.status === 'received').length;
      const onTimeRate = orders.length > 0 ? (receivedCount / orders.length) * 100 : 0;
      
      let rating = 1;
      if (totalAmount > 500000) rating = 5;
      else if (totalAmount > 200000) rating = 4;
      else if (totalAmount > 100000) rating = 3;
      else if (totalAmount > 50000) rating = 2;

      return {
        ...s,
        purchaseCount: orders.length,
        totalAmount,
        onTimeRate,
        rating
      };
    });
  }, [suppliers, erpData.purchaseOrders]);

  // Helper Components
  const UrgencyBadge = ({ urgency }: { urgency: string }) => {
    switch (urgency) {
      case 'low': return <Badge variant="default">低</Badge>;
      case 'medium': return <Badge variant="info">中</Badge>;
      case 'high': return <Badge variant="warning">高</Badge>;
      case 'urgent': return <Badge variant="danger">紧急</Badge>;
      default: return <Badge variant="default">{urgency}</Badge>;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'draft': return <Badge variant="default">草稿</Badge>;
      case 'pending': return <Badge variant="warning">待审批</Badge>;
      case 'approved': return <Badge variant="success">已批准</Badge>;
      case 'rejected': return <Badge variant="danger">已拒绝</Badge>;
      case 'cancelled': return <Badge variant="default">已取消</Badge>;
      case 'received': return <Badge variant="success">已收货</Badge>;
      case 'partial_received': return <Badge variant="info">部分收货</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500 mt-1">管理从采购申请到订单执行的全流程</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'request' && (
            <Button onClick={() => handleOpenPrModal()} className="shadow-sm">
              <Plus size={18} />
              新建申请
            </Button>
          )}
          {activeTab === 'order' && (
            <Button onClick={() => handleOpenPoModal()} className="shadow-sm">
              <Plus size={18} />
              新建订单
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'request' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('request')}
        >
          采购申请
          {activeTab === 'request' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'order' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('order')}
        >
          采购订单
          {activeTab === 'order' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'supplier' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('supplier')}
        >
          供应商评估
          {activeTab === 'supplier' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {activeTab === 'request' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <ClipboardList size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">总申请数</p>
                <p className="text-xl font-bold">{prStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-xl font-bold">{prStats.pending}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-xl font-bold">{prStats.approved}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">紧急申请</p>
                <p className="text-xl font-bold text-red-600">{prStats.urgent}</p>
              </div>
            </div>
          </div>

          {/* Table & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索申请单号或商品名..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={prSearch}
                  onChange={(e) => setPrSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                  value={prStatusFilter}
                  onChange={(e) => setPrStatusFilter(e.target.value)}
                >
                  <option value="all">所有状态</option>
                  <option value="pending">待审批</option>
                  <option value="approved">已批准</option>
                  <option value="rejected">已拒绝</option>
                  <option value="draft">草稿</option>
                </select>
                <select
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                  value={prUrgencyFilter}
                  onChange={(e) => setPrUrgencyFilter(e.target.value)}
                >
                  <option value="all">紧急程度</option>
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                    <th className="px-6 py-4">单号</th>
                    <th className="px-6 py-4">申请部门/人</th>
                    <th className="px-6 py-4">商品名/SKU</th>
                    <th className="px-6 py-4">数量</th>
                    <th className="px-6 py-4">估价</th>
                    <th className="px-6 py-4">紧急程度</th>
                    <th className="px-6 py-4">需求日期</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPrs.map((pr) => (
                    <tr key={pr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{pr.prNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{pr.departmentName}</span>
                          <span className="text-xs text-gray-500">{pr.requestorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{pr.productName}</span>
                          <span className="text-xs text-gray-500 font-mono">{pr.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {pr.quantity} {pr.unit}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ¥{pr.totalEstimated.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge urgency={pr.urgency} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {pr.requiredDate}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pr.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenPrModal(pr)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('确定要删除吗？')) {
                                erpStore.deletePurchaseRequest(pr.id);
                                refresh();
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'order' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">采购单总数</p>
                <p className="text-xl font-bold">{poStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">待收货</p>
                <p className="text-xl font-bold">{poStats.pending}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月采购总额</p>
                <p className="text-xl font-bold">¥{poStats.thisMonthTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索单号、供应商..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                    <th className="px-6 py-4">单号</th>
                    <th className="px-6 py-4">供应商</th>
                    <th className="px-6 py-4">目标仓库</th>
                    <th className="px-6 py-4">商品摘要</th>
                    <th className="px-6 py-4">总金额</th>
                    <th className="px-6 py-4">预计到货</th>
                    <th className="px-6 py-4">收货日期</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPos.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{po.poNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-gray-900 font-medium">{po.supplierName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{po.warehouseName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{po.items[0]?.productName || '-'}</span>
                          {po.items.length > 1 && (
                            <span className="text-xs text-gray-500">等共 {po.items.length} 种</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ¥{po.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{po.expectedDate}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{po.receivedDate || '-'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenPoModal(po)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplierStats.map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-500">{s.category}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < s.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} 
                    />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                <div>
                  <p className="text-xs text-gray-500">采购次数</p>
                  <p className="font-bold text-gray-900">{s.purchaseCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">采购总额</p>
                  <p className="font-bold text-gray-900">¥{s.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">按时收货率</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{s.onTimeRate.toFixed(1)}%</p>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${s.onTimeRate}%` }} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                    {s.status === 'active' ? '合作中' : '已停止'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={14} className="text-gray-400" />
                  {s.contact} | {s.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  {s.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PR Modal */}
      <Modal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        title={editingPr ? '编辑采购申请' : '新建采购申请'}
        size="lg"
      >
        <form onSubmit={handlePrSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">申请部门</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.departmentName}
                onChange={e => setPrFormData({ ...prFormData, departmentName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">申请人</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.requestorName}
                onChange={e => setPrFormData({ ...prFormData, requestorName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">商品名称</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.productName}
                onChange={e => setPrFormData({ ...prFormData, productName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.sku}
                onChange={e => setPrFormData({ ...prFormData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">数量</label>
              <input
                required
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.quantity}
                onChange={e => setPrFormData({ ...prFormData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">单位</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.unit}
                onChange={e => setPrFormData({ ...prFormData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">估价 (单价)</label>
              <input
                required
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.estimatedPrice}
                onChange={e => setPrFormData({ ...prFormData, estimatedPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">总估价 (自动计算)</label>
              <input
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-500"
                value={prFormData.quantity * prFormData.estimatedPrice}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">紧急程度</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={prFormData.urgency}
                onChange={e => setPrFormData({ ...prFormData, urgency: e.target.value as any })}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">需求日期</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.requiredDate}
                onChange={e => setPrFormData({ ...prFormData, requiredDate: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">采购原因</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 resize-none"
                rows={2}
                value={prFormData.reason}
                onChange={e => setPrFormData({ ...prFormData, reason: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">审批状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={prFormData.status}
                onChange={e => setPrFormData({ ...prFormData, status: e.target.value as ApprovalStatus })}
              >
                <option value="draft">草稿</option>
                <option value="pending">待审批</option>
                <option value="approved">已批准</option>
                <option value="rejected">已拒绝</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">审批人</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={prFormData.approverName}
                onChange={e => setPrFormData({ ...prFormData, approverName: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsPrModalOpen(false)}>取消</Button>
            <Button type="submit">保存申请</Button>
          </div>
        </form>
      </Modal>

      {/* PO Modal */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title={editingPo ? '编辑采购订单' : '新建采购订单'}
        size="lg"
      >
        <form onSubmit={handlePoSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">供应商</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={poFormData.supplierId}
                onChange={e => {
                  const s = suppliers.find(item => item.id === e.target.value);
                  setPoFormData({ ...poFormData, supplierId: e.target.value, supplierName: s?.name || '' });
                }}
              >
                <option value="">选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">目标仓库</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                value={poFormData.warehouseId}
                onChange={e => {
                  const w = warehouses.find(item => item.id === e.target.value);
                  setPoFormData({ ...poFormData, warehouseId: e.target.value, warehouseName: w?.name || '' });
                }}
              >
                <option value="">选择仓库</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            
            <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-sm font-bold text-gray-900 mb-3">商品明细</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">商品名称</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    value={poItem.productName}
                    onChange={e => setPoItem({ ...poItem, productName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">SKU</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    value={poItem.sku}
                    onChange={e => setPoItem({ ...poItem, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">数量</label>
                  <input
                    required
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    value={poItem.quantity}
                    onChange={e => setPoItem({ ...poItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">单位</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    value={poItem.unit}
                    onChange={e => setPoItem({ ...poItem, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">单价 (CNY)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                    value={poItem.unitPrice}
                    onChange={e => setPoItem({ ...poItem, unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">小计</label>
                  <input
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    value={poItem.quantity * poItem.unitPrice}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 col-span-2 mt-2 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">预计到货日</label>
                <input
                  required
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  value={poFormData.expectedDate}
                  onChange={e => setPoFormData({ ...poFormData, expectedDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">付款条款</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  placeholder="如: 30天账期"
                  value={poFormData.paymentTerms}
                  onChange={e => setPoFormData({ ...poFormData, paymentTerms: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">负责人</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  value={poFormData.operator}
                  onChange={e => setPoFormData({ ...poFormData, operator: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">状态</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white focus:border-blue-500"
                  value={poFormData.status}
                  onChange={e => setPoFormData({ ...poFormData, status: e.target.value as any })}
                >
                  <option value="pending">待收货</option>
                  <option value="received">已收货</option>
                  <option value="partial_received">部分收货</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsPoModalOpen(false)}>取消</Button>
            <Button type="submit">生成订单</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchasePage;
