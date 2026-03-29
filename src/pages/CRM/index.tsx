import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, User, Building2, Phone, Mail, MapPin, Tag, FileText, TrendingUp, Users, DollarSign, Calendar, LayoutGrid, Layers, Briefcase } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useRefresh } from '../../store/reactive';
import { erpStore } from '../../store/erp';
import { Customer, Opportunity, Contract, OpportunityStage, ContractStatus } from '../../types/erp';

const CRMPage: React.FC = () => {
  const refresh = useRefresh();
  const { customers, opportunities, contracts } = erpStore.getState();
  const [activeTab, setActiveTab] = useState<'customer' | 'opportunity' | 'contract'>('customer');

  // --- Tab 1: Customer Management Logic ---
  const [custSearch, setCustSearch] = useState('');
  const [custStatusFilter, setCustStatusFilter] = useState('all');
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                          c.contact.toLowerCase().includes(custSearch.toLowerCase()) ||
                          c.industry.toLowerCase().includes(custSearch.toLowerCase());
      const matchStatus = custStatusFilter === 'all' || c.status === custStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, custSearch, custStatusFilter]);

  const pagedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const thisMonth = customers.filter(c => c.createdAt.startsWith(new Date().toISOString().substring(0, 7))).length;
    const totalSales = customers.reduce((sum, c) => sum + (c.totalPurchase || 0), 0);
    return { total, active, thisMonth, totalSales };
  }, [customers]);

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      type: formData.get('type'),
      industry: formData.get('industry'),
      region: formData.get('region'),
      contact: formData.get('contact'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      level: formData.get('level'),
      status: formData.get('status'),
      assignedTo: formData.get('assignedTo'),
      tags: formData.get('tags'),
      notes: formData.get('notes'),
      totalPurchase: editingCust ? editingCust.totalPurchase : 0,
      lastPurchaseDate: editingCust ? editingCust.lastPurchaseDate : '',
    };

    if (editingCust) {
      erpStore.updateCustomer(editingCust.id, data);
    } else {
      erpStore.addCustomer(data);
    }
    setIsCustModalOpen(false);
    setEditingCust(null);
    refresh();
  };

  const deleteCustomer = (id: string) => {
    if (confirm('确定删除该客户吗？')) {
      erpStore.deleteCustomer(id);
      refresh();
    }
  };

  // --- Tab 2: Opportunity Logic ---
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [probValue, setProbValue] = useState(50);

  const oppStats = useMemo(() => {
    const total = opportunities.length;
    const totalAmount = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
    const thisQuarterAmount = opportunities
      .filter(o => {
        const month = new Date(o.expectedCloseDate).getMonth();
        const currentMonth = new Date().getMonth();
        return Math.floor(month / 3) === Math.floor(currentMonth / 3);
      })
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const avgProb = total > 0 ? opportunities.reduce((sum, o) => sum + (o.probability || 0), 0) / total : 0;
    return { total, totalAmount, thisQuarterAmount, avgProb };
  }, [opportunities]);

  const stages: { key: OpportunityStage; label: string; color: string }[] = [
    { key: 'lead', label: '线索', color: 'bg-gray-100 border-gray-200' },
    { key: 'qualified', label: '意向', color: 'bg-blue-50 border-blue-100' },
    { key: 'proposal', label: '报价', color: 'bg-yellow-50 border-yellow-100' },
    { key: 'negotiation', label: '谈判', color: 'bg-orange-50 border-orange-100' },
    { key: 'won', label: '成交', color: 'bg-green-50 border-green-100' },
    { key: 'lost', label: '丢单', color: 'bg-red-50 border-red-100' },
  ];

  const handleSaveOpp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      title: formData.get('title'),
      customerName: formData.get('customerName'),
      stage: formData.get('stage'),
      amount: Number(formData.get('amount')),
      probability: Number(formData.get('probability')),
      expectedCloseDate: formData.get('expectedCloseDate'),
      assignedTo: formData.get('assignedTo'),
      source: formData.get('source'),
      products: formData.get('products'),
      notes: formData.get('notes'),
      customerId: editingOpp ? editingOpp.customerId : '',
    };

    if (editingOpp) {
      erpStore.updateOpportunity(editingOpp.id, data);
    } else {
      erpStore.addOpportunity(data);
    }
    setIsOppModalOpen(false);
    setEditingOpp(null);
    refresh();
  };

  // --- Tab 3: Contract Logic ---
  const [isConModalOpen, setIsConModalOpen] = useState(false);
  const [editingCon, setEditingCon] = useState<Contract | null>(null);

  const contractStats = useMemo(() => {
    const total = contracts.length;
    const executing = contracts.filter(c => c.status === 'active').length;
    const expiring = contracts.filter(c => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      const now = new Date();
      return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
    }).length;
    const totalAmount = contracts.reduce((sum, c) => sum + (c.amount || 0), 0);
    return { total, executing, expiring, totalAmount };
  }, [contracts]);

  const handleSaveContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      title: formData.get('title'),
      customerName: formData.get('customerName'),
      type: formData.get('type'),
      amount: Number(formData.get('amount')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      signedDate: formData.get('signedDate'),
      assignedTo: formData.get('assignedTo'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      customerId: editingCon ? editingCon.customerId : '',
      attachments: editingCon ? editingCon.attachments : '',
    };

    if (editingCon) {
      erpStore.updateContract(editingCon.id, data);
    } else {
      erpStore.addContract(data);
    }
    setIsConModalOpen(false);
    setEditingCon(null);
    refresh();
  };

  // --- UI Helpers ---
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'A': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">A级VIP</span>;
      case 'B': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">B级</span>;
      case 'C': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">C级</span>;
      case 'D': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">D级</span>;
      default: return null;
    }
  };

  const getCustStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">合作中</Badge>;
      case 'inactive': return <Badge variant="default">暂停</Badge>;
      case 'potential': return <Badge variant="warning">潜在</Badge>;
      default: return null;
    }
  };

  const getOppStageBadge = (stage: string) => {
    switch (stage) {
      case 'lead': return <Badge variant="default">线索</Badge>;
      case 'qualified': return <Badge variant="info">意向</Badge>;
      case 'proposal': return <Badge variant="warning">报价</Badge>;
      case 'negotiation': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">谈判</span>;
      case 'won': return <Badge variant="success">成交</Badge>;
      case 'lost': return <Badge variant="danger">丢单</Badge>;
      default: return null;
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="default">草稿</Badge>;
      case 'active': return <Badge variant="success">执行中</Badge>;
      case 'expired': return <Badge variant="danger">已到期</Badge>;
      case 'terminated': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-black text-white">已终止</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM 客户关系管理</h1>
          <p className="text-gray-500 text-sm">管理客户资产、销售机会及合同协议</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'customer' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Users size={16} /> 客户管理
          </button>
          <button
            onClick={() => setActiveTab('opportunity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'opportunity' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <TrendingUp size={16} /> 销售商机
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'contract' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Briefcase size={16} /> 合同管理
          </button>
        </div>
      </div>

      {/* Tab 1: Customer Management */}
      {activeTab === 'customer' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">总客户数</span>
                <Users className="text-blue-500" size={20} />
              </div>
              <div className="text-2xl font-bold">{customerStats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">活跃客户</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="text-2xl font-bold">{customerStats.active}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">本月新增</span>
                <Plus className="text-orange-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-orange-600">+{customerStats.thisMonth}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">总销售额</span>
                <DollarSign className="text-green-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-green-600">¥{customerStats.totalSales.toLocaleString()}</div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-1 gap-4 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索客户名称、联系人、行业..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                value={custStatusFilter}
                onChange={(e) => setCustStatusFilter(e.target.value)}
              >
                <option value="all">所有状态</option>
                <option value="active">合作中</option>
                <option value="inactive">暂停</option>
                <option value="potential">潜在</option>
              </select>
            </div>
            <Button onClick={() => { setEditingCust(null); setIsCustModalOpen(true); }}>
              <Plus size={18} /> 新增客户
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">客户编号/名称</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">类型/行业</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">联系人</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">等级</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">负责人</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">累计采购</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.customerNo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{c.type === 'enterprise' ? '企业' : '个人'}</div>
                      <div className="text-xs text-gray-400">{c.industry}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{c.contact}</div>
                      <div className="text-xs text-gray-400">{c.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getLevelBadge(c.level)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.assignedTo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
                      ¥{(c.totalPurchase || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getCustStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingCust(c); setIsCustModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteCustomer(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>共 {filteredCustomers.length} 条数据</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</Button>
                <Button size="sm" variant="secondary" disabled={currentPage * pageSize >= filteredCustomers.length} onClick={() => setCurrentPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Sales Opportunity */}
      {activeTab === 'opportunity' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">商机总数</div>
              <div className="text-2xl font-bold">{oppStats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">预计总金额</div>
              <div className="text-2xl font-bold text-blue-600">¥{oppStats.totalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">本季预计成交</div>
              <div className="text-2xl font-bold text-green-600">¥{oppStats.thisQuarterAmount.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">平均概率</div>
              <div className="text-2xl font-bold text-orange-600">{oppStats.avgProb.toFixed(1)}%</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">销售漏斗</h2>
            <Button onClick={() => { setEditingOpp(null); setProbValue(50); setIsOppModalOpen(true); }}>
              <Plus size={18} /> 新增商机
            </Button>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-400px)] min-h-[500px]">
            {stages.map(stage => {
              const stageOpps = opportunities.filter(o => o.stage === stage.key);
              const totalAmount = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
              return (
                <div key={stage.key} className={`flex-shrink-0 w-80 rounded-xl border flex flex-col ${stage.color}`}>
                  <div className="p-4 border-b border-inherit flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{stage.label}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-white/50 rounded text-xs text-gray-600">{stageOpps.length}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-600">¥{totalAmount.toLocaleString()}</div>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {stageOpps.map(opp => (
                      <div key={opp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 text-sm">{opp.title}</h3>
                          <button onClick={() => { setEditingOpp(opp); setProbValue(opp.probability); setIsOppModalOpen(true); }} className="text-gray-400 hover:text-blue-600">
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">{opp.customerName}</div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-bold text-blue-600">¥{opp.amount.toLocaleString()}</div>
                          <div className="text-xs font-medium text-gray-500">{opp.probability}%</div>
                        </div>
                        {/* Prob bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-3 overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${opp.probability}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {opp.expectedCloseDate}</span>
                          <span className="flex items-center gap-1"><User size={12} /> {opp.assignedTo}</span>
                        </div>
                      </div>
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        无商机
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Contract Management */}
      {activeTab === 'contract' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">合同总数</div>
              <div className="text-2xl font-bold">{contractStats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">执行中</div>
              <div className="text-2xl font-bold text-green-600">{contractStats.executing}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">本月到期</div>
              <div className="text-2xl font-bold text-red-600">{contractStats.expiring}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">合同总金额</div>
              <div className="text-2xl font-bold text-blue-600">¥{contractStats.totalAmount.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => { setEditingCon(null); setIsConModalOpen(true); }}>
              <Plus size={18} /> 新增合同
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">合同号/标题</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">客户</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">类型</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-right">金额</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">有效期</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">负责人</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map(con => (
                  <tr key={con.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{con.title}</div>
                      <div className="text-xs text-gray-400">{con.contractNo}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{con.customerName}</td>
                    <td className="px-6 py-4">
                      {con.type === 'sales' && '销售合同'}
                      {con.type === 'purchase' && '采购合同'}
                      {con.type === 'service' && '服务合同'}
                      {con.type === 'other' && '其他合同'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">¥{con.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">{con.startDate} 至</div>
                      <div className="text-xs">{con.endDate}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{con.assignedTo}</td>
                    <td className="px-6 py-4">{getContractStatusBadge(con.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingCon(con); setIsConModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if(confirm('确定删除吗？')){ erpStore.deleteContract(con.id); refresh(); } }} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      
      {/* Customer Modal */}
      <Modal
        isOpen={isCustModalOpen}
        onClose={() => setIsCustModalOpen(false)}
        title={editingCust ? '编辑客户' : '新增客户'}
        size="lg"
      >
        <form onSubmit={handleSaveCustomer} className="grid grid-cols-2 gap-4">
          <Input label="客户名称" name="name" defaultValue={editingCust?.name} required />
          <Select
            label="客户类型"
            name="type"
            defaultValue={editingCust?.type || 'enterprise'}
            options={[
              { value: 'enterprise', label: '企业' },
              { value: 'individual', label: '个人' }
            ]}
          />
          <Input label="行业" name="industry" defaultValue={editingCust?.industry} />
          <Input label="地区" name="region" defaultValue={editingCust?.region} />
          <Input label="联系人" name="contact" defaultValue={editingCust?.contact} required />
          <Input label="手机号" name="phone" defaultValue={editingCust?.phone} required />
          <Input label="邮箱" name="email" type="email" defaultValue={editingCust?.email} />
          <Input label="负责销售" name="assignedTo" defaultValue={editingCust?.assignedTo} />
          <div className="col-span-2">
            <Input label="地址" name="address" defaultValue={editingCust?.address} />
          </div>
          <Select
            label="客户等级"
            name="level"
            defaultValue={editingCust?.level || 'B'}
            options={[
              { value: 'A', label: 'A级VIP' },
              { value: 'B', label: 'B级' },
              { value: 'C', label: 'C级' },
              { value: 'D', label: 'D级' }
            ]}
          />
          <Select
            label="客户状态"
            name="status"
            defaultValue={editingCust?.status || 'potential'}
            options={[
              { value: 'active', label: '合作中' },
              { value: 'inactive', label: '暂停' },
              { value: 'potential', label: '潜在' }
            ]}
          />
          <Input label="标签 (逗号分隔)" name="tags" defaultValue={editingCust?.tags} />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              name="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              defaultValue={editingCust?.notes}
            />
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCustModalOpen(false)}>取消</Button>
            <Button type="submit">保存客户</Button>
          </div>
        </form>
      </Modal>

      {/* Opportunity Modal */}
      <Modal
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        title={editingOpp ? '编辑商机' : '新增商机'}
      >
        <form onSubmit={handleSaveOpp} className="space-y-4">
          <Input label="商机标题" name="title" defaultValue={editingOpp?.title} required />
          <Input label="客户名称" name="customerName" defaultValue={editingOpp?.customerName} required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="商机阶段"
              name="stage"
              defaultValue={editingOpp?.stage || 'lead'}
              options={stages.map(s => ({ value: s.key, label: s.label }))}
            />
            <Input label="预计金额" name="amount" type="number" defaultValue={editingOpp?.amount} required />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">成交概率</label>
              <span className="text-sm font-bold text-blue-600">{probValue}%</span>
            </div>
            <input
              type="range"
              name="probability"
              min="0"
              max="100"
              value={probValue}
              onChange={(e) => setProbValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="预期关闭日期" name="expectedCloseDate" type="date" defaultValue={editingOpp?.expectedCloseDate} required />
            <Input label="负责人" name="assignedTo" defaultValue={editingOpp?.assignedTo} required />
          </div>
          <Input label="来源渠道" name="source" defaultValue={editingOpp?.source} />
          <Input label="意向产品" name="products" defaultValue={editingOpp?.products} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              name="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2}
              defaultValue={editingOpp?.notes}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOppModalOpen(false)}>取消</Button>
            <Button type="submit">保存商机</Button>
          </div>
        </form>
      </Modal>

      {/* Contract Modal */}
      <Modal
        isOpen={isConModalOpen}
        onClose={() => setIsConModalOpen(false)}
        title={editingCon ? '编辑合同' : '新增合同'}
      >
        <form onSubmit={handleSaveContract} className="space-y-4">
          <Input label="合同标题" name="title" defaultValue={editingCon?.title} required />
          <Input label="客户名称" name="customerName" defaultValue={editingCon?.customerName} required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="合同类型"
              name="type"
              defaultValue={editingCon?.type || 'sales'}
              options={[
                { value: 'sales', label: '销售合同' },
                { value: 'purchase', label: '采购合同' },
                { value: 'service', label: '服务合同' },
                { value: 'other', label: '其他' }
              ]}
            />
            <Input label="合同金额" name="amount" type="number" defaultValue={editingCon?.amount} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="开始日期" name="startDate" type="date" defaultValue={editingCon?.startDate} required />
            <Input label="结束日期" name="endDate" type="date" defaultValue={editingCon?.endDate} required />
            <Input label="签订日期" name="signedDate" type="date" defaultValue={editingCon?.signedDate} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="负责人" name="assignedTo" defaultValue={editingCon?.assignedTo} required />
            <Select
              label="合同状态"
              name="status"
              defaultValue={editingCon?.status || 'draft'}
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'active', label: '执行中' },
                { value: 'expired', label: '已到期' },
                { value: 'terminated', label: '已终止' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              name="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2}
              defaultValue={editingCon?.notes}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsConModalOpen(false)}>取消</Button>
            <Button type="submit">保存合同</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CRMPage;
