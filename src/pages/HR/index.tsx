import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  CalendarCheck, 
  Banknote, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useRefresh } from '../../store/reactive';
import { erpStore } from '../../store/erp';
import { 
  Employee, 
  Department, 
  AttendanceRecord, 
  PayrollRecord, 
  AttendanceStatus 
} from '../../types/erp';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

// --- 常量映射 ---
const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: '全职',
  part_time: '兼职',
  contract: '合同工',
  intern: '实习'
};

const EMPLOYEE_STATUS: Record<string, { label: string; variant: 'success' | 'default' | 'danger' }> = {
  active: { label: '在职', variant: 'success' },
  inactive: { label: '停职', variant: 'default' },
  resigned: { label: '离职', variant: 'danger' }
};

const ATTENDANCE_STATUS: Record<AttendanceStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  present: { label: '正常', variant: 'success' },
  late: { label: '迟道', variant: 'warning' },
  absent: { label: '缺勤', variant: 'danger' },
  leave: { label: '请假', variant: 'info' },
  holiday: { label: '节假日', variant: 'default' }
};

const PAYROLL_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'success' }> = {
  draft: { label: '草稿', variant: 'default' },
  approved: { label: '已审批', variant: 'info' },
  paid: { label: '已发放', variant: 'success' }
};

const HRPage: React.FC = () => {
  const refresh = useRefresh();
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'attendance' | 'payroll'>('employees');
  
  const state = erpStore.getState();
  const departments = state.departments;
  const employees = state.employees;
  const attendanceRecords = state.attendanceRecords;
  const payrollRecords = state.payrollRecords;

  // --- 员工档案相关状态 ---
  const [empPage, setEmpPage] = useState(1);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // --- 部门管理相关状态 ---
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // --- 考勤管理相关状态 ---
  const [attFilter, setAttFilter] = useState({ employeeId: '', startDate: '', endDate: '' });
  const [isAttModalOpen, setIsAttModalOpen] = useState(false);

  // --- 薪资管理相关状态 ---
  const [payrollFilter, setPayrollFilter] = useState({ period: '', departmentId: '' });
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);

  // --- 通用处理 ---
  const handleDelete = (type: 'employee' | 'department' | 'attendance' | 'payroll', id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      if (type === 'employee') erpStore.deleteEmployee(id);
      else if (type === 'department') erpStore.deleteDepartment(id);
      else if (type === 'attendance') erpStore.deleteAttendance(id);
      else if (type === 'payroll') erpStore.deletePayroll(id);
      refresh();
    }
  };

  // --- Tab 1: 员工档案逻辑 ---
  const empStats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const thisMonth = new Date().toISOString().substring(0, 7);
    const newHires = employees.filter(e => e.hireDate.startsWith(thisMonth)).length;
    
    const deptCounts: Record<string, number> = {};
    employees.forEach(e => {
      deptCounts[e.departmentName] = (deptCounts[e.departmentName] || 0) + 1;
    });
    let topDept = '无';
    let max = 0;
    Object.entries(deptCounts).forEach(([name, count]) => {
      if (count > max) { max = count; topDept = name; }
    });

    return { total, active, newHires, topDept };
  }, [employees]);

  const pagedEmployees = useMemo(() => {
    const start = (empPage - 1) * 10;
    return employees.slice(start, start + 10);
  }, [employees, empPage]);

  // --- Tab 2: 部门列表 ---
  const deptCards = departments;

  // --- Tab 3: 考勤逻辑 ---
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter(r => {
      const matchEmp = !attFilter.employeeId || r.employeeId === attFilter.employeeId;
      const matchStart = !attFilter.startDate || r.date >= attFilter.startDate;
      const matchEnd = !attFilter.endDate || r.date <= attFilter.endDate;
      return matchEmp && matchStart && matchEnd;
    });
  }, [attendanceRecords, attFilter]);

  // --- Tab 4: 薪资逻辑 ---
  const filteredPayroll = useMemo(() => {
    return payrollRecords.filter(r => {
      const matchPeriod = !payrollFilter.period || r.period === payrollFilter.period;
      const matchDept = !payrollFilter.departmentId || departments.find(d => d.id === payrollFilter.departmentId)?.name === r.departmentName;
      return matchPeriod && matchDept;
    });
  }, [payrollRecords, payrollFilter, departments]);

  const payrollStats = useMemo(() => {
    const total = filteredPayroll.reduce((sum, r) => sum + r.baseSalary + r.overtimePay + r.bonus, 0);
    const net = filteredPayroll.reduce((sum, r) => sum + r.netSalary, 0);
    const unpaid = filteredPayroll.filter(r => r.status !== 'paid').length;
    return { total, net, unpaid };
  }, [filteredPayroll]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">人力资源管理</h1>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border">
          <button 
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'employees' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users size={18} /> 员工档案
          </button>
          <button 
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'departments' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Building2 size={18} /> 部门管理
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <CalendarCheck size={18} /> 考勤管理
          </button>
          <button 
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Banknote size={18} /> 薪资管理
          </button>
        </div>
      </div>

      {/* --- Tab 1: 员工档案 --- */}
      {activeTab === 'employees' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-500">总员工数</p>
              <p className="text-2xl font-bold mt-1">{empStats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-green-500">
              <p className="text-sm text-gray-500">在职人数</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{empStats.active}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
              <p className="text-sm text-gray-500">本月新入职</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{empStats.newHires}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-500">规模最大部门</p>
              <p className="text-2xl font-bold mt-1">{empStats.topDept}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Search size={18} />
                <span>列表展示（共 {employees.length} 条）</span>
              </div>
              <Button onClick={() => { setEditingEmp(null); setIsEmpModalOpen(true); }} size="sm">
                <UserPlus size={18} /> 新增员工
              </Button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">工号</th>
                  <th className="px-6 py-3">姓名</th>
                  <th className="px-6 py-3">部门</th>
                  <th className="px-6 py-3">职位</th>
                  <th className="px-6 py-3">雇佣类型</th>
                  <th className="px-6 py-3">基本薪资</th>
                  <th className="px-6 py-3">入职日期</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.empNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {emp.name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.departmentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.position}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{EMPLOYMENT_TYPES[emp.employmentType]}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">¥{emp.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.hireDate}</td>
                    <td className="px-6 py-4">
                      <Badge variant={EMPLOYEE_STATUS[emp.status]?.variant}>
                        {EMPLOYEE_STATUS[emp.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingEmp(emp); setIsEmpModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                      <button onClick={() => handleDelete('employee', emp.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">
                第 {empPage} 页，共 {Math.ceil(employees.length / 10)} 页
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" size="sm" 
                  disabled={empPage === 1} 
                  onClick={() => setEmpPage(p => p - 1)}
                >
                  <ChevronLeft size={16} /> 上一页
                </Button>
                <Button 
                  variant="secondary" size="sm" 
                  disabled={empPage >= Math.ceil(employees.length / 10)} 
                  onClick={() => setEmpPage(p => p + 1)}
                >
                  下一页 <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: 部门管理 --- */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingDept(null); setIsDeptModalOpen(true); }}>
              <Plus size={18} /> 新增部门
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {deptCards.map(dept => (
              <div key={dept.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">负责人：{dept.managerName || '未指定'}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                    ID: {dept.id}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">部门人数</p>
                    <p className="font-semibold text-gray-900">{dept.headcount} 人</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">年度预算</p>
                    <p className="font-semibold text-gray-900">¥{(dept.budget / 10000).toFixed(1)}w</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-dashed">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingDept(dept); setIsDeptModalOpen(true); }}>
                    <Edit size={14} /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete('department', dept.id)}>
                    <Trash2 size={14} /> 删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Tab 3: 考勤管理 --- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-end gap-4">
            <div className="w-48">
              <Select 
                label="员工筛选" 
                options={[{ value: '', label: '全部员工' }, ...employees.map(e => ({ value: e.id, label: e.name }))]}
                value={attFilter.employeeId}
                onChange={(e) => setAttFilter({ ...attFilter, employeeId: e.target.value })}
              />
            </div>
            <div className="w-48">
              <Input 
                label="开始日期" type="date"
                value={attFilter.startDate}
                onChange={(e) => setAttFilter({ ...attFilter, startDate: e.target.value })}
              />
            </div>
            <div className="w-48">
              <Input 
                label="结束日期" type="date"
                value={attFilter.endDate}
                onChange={(e) => setAttFilter({ ...attFilter, endDate: e.target.value })}
              />
            </div>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => setIsAttModalOpen(true)}>
                <Plus size={18} /> 打卡录入
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">员工</th>
                  <th className="px-6 py-3">部门</th>
                  <th className="px-6 py-3">日期</th>
                  <th className="px-6 py-3">签到时间</th>
                  <th className="px-6 py-3">签退时间</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">加班</th>
                  <th className="px-6 py-3">备注</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendance.map(att => (
                  <tr key={att.id} className="text-sm">
                    <td className="px-6 py-4 font-medium text-gray-900">{att.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600">{att.departmentName}</td>
                    <td className="px-6 py-4 text-gray-600">{att.date}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{att.checkIn || '--:--'}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{att.checkOut || '--:--'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={ATTENDANCE_STATUS[att.status]?.variant}>
                        {ATTENDANCE_STATUS[att.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{att.overtimeHours}h</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]">{att.notes}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete('attendance', att.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">暂无符合条件的考勤记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab 4: 薪资管理 --- */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-end gap-4">
            <div className="w-40">
              <Input 
                label="期间" type="month"
                value={payrollFilter.period}
                onChange={(e) => setPayrollFilter({ ...payrollFilter, period: e.target.value })}
              />
            </div>
            <div className="w-48">
              <Select 
                label="部门筛选" 
                options={[{ value: '', label: '全部部门' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                value={payrollFilter.departmentId}
                onChange={(e) => setPayrollFilter({ ...payrollFilter, departmentId: e.target.value })}
              />
            </div>
            <div className="ml-auto">
              <Button onClick={() => { setEditingPayroll(null); setIsPayrollModalOpen(true); }}>
                <Plus size={18} /> 生成工资单
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-500">本期应发总额</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">¥{payrollStats.total.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-500">实发合计 (含税后)</p>
              <p className="text-3xl font-bold mt-2 text-green-600">¥{payrollStats.net.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-500">待发放单据</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{payrollStats.unpaid} 份</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">单号</th>
                  <th className="px-6 py-3">员工</th>
                  <th className="px-6 py-3">期间</th>
                  <th className="px-6 py-3">基本薪资</th>
                  <th className="px-6 py-3">加班/奖金</th>
                  <th className="px-6 py-3">扣款/社保/税</th>
                  <th className="px-6 py-3 font-bold">实发额</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayroll.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-gray-500">{p.payrollNo}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.employeeName}</p>
                      <p className="text-xs text-gray-500">{p.departmentName}</p>
                    </td>
                    <td className="px-6 py-4">{p.period}</td>
                    <td className="px-6 py-4">¥{p.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600">
                      +¥{(p.overtimePay + p.bonus).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-red-600">
                      -¥{(p.deductions + p.socialInsurance + p.tax).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-700">¥{p.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={PAYROLL_STATUS[p.status]?.variant}>
                        {PAYROLL_STATUS[p.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingPayroll(p); setIsPayrollModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                      <button onClick={() => handleDelete('payroll', p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Modals --- */}
      
      {/* 员工 Modal */}
      <Modal 
        isOpen={isEmpModalOpen} 
        onClose={() => setIsEmpModalOpen(false)} 
        title={editingEmp ? '编辑员工' : '新增员工'}
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData.entries());
          const deptId = data.departmentId as string;
          const dept = departments.find(d => d.id === deptId);
          
          const payload = {
            ...data,
            baseSalary: Number(data.baseSalary),
            departmentName: dept?.name || '',
          } as any;

          if (editingEmp) erpStore.updateEmployee(editingEmp.id, payload);
          else erpStore.addEmployee(payload);
          
          refresh();
          setIsEmpModalOpen(false);
        }} className="grid grid-cols-2 gap-4">
          <Input label="姓名" name="name" defaultValue={editingEmp?.name} required />
          <Select label="性别" name="gender" defaultValue={editingEmp?.gender} options={[{value: 'male', label: '男'}, {value: 'female', label: '女'}]} />
          <Select 
            label="部门" name="departmentId" defaultValue={editingEmp?.departmentId} 
            options={departments.map(d => ({ value: d.id, label: d.name }))} required
          />
          <Input label="职位" name="position" defaultValue={editingEmp?.position} required />
          <Select label="雇佣类型" name="employmentType" defaultValue={editingEmp?.employmentType} options={Object.entries(EMPLOYMENT_TYPES).map(([v, l]) => ({value: v, label: l}))} />
          <Input label="基本薪资" name="baseSalary" type="number" defaultValue={editingEmp?.baseSalary} required />
          <Input label="手机" name="phone" defaultValue={editingEmp?.phone} required />
          <Input label="邮箱" name="email" type="email" defaultValue={editingEmp?.email} required />
          <Input label="入职日期" name="hireDate" type="date" defaultValue={editingEmp?.hireDate} required />
          <Select label="状态" name="status" defaultValue={editingEmp?.status || 'active'} options={Object.entries(EMPLOYEE_STATUS).map(([v, s]) => ({value: v, label: s.label}))} />
          <Input label="身份证" name="idCard" defaultValue={editingEmp?.idCard} />
          <Input label="出生日期" name="birthDate" type="date" defaultValue={editingEmp?.birthDate} />
          <div className="col-span-2"><Input label="地址" name="address" defaultValue={editingEmp?.address} /></div>
          <Input label="紧急联系人" name="emergencyContact" defaultValue={editingEmp?.emergencyContact} />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea name="notes" defaultValue={editingEmp?.notes} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-24" />
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEmpModalOpen(false)}>取消</Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>

      {/* 部门 Modal */}
      <Modal 
        isOpen={isDeptModalOpen} 
        onClose={() => setIsDeptModalOpen(false)} 
        title={editingDept ? '编辑部门' : '新增部门'}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData.entries());
          const payload = { ...data, budget: Number(data.budget), headcount: editingDept?.headcount || 0 } as any;
          
          if (editingDept) erpStore.updateDepartment(editingDept.id, payload);
          else erpStore.addDepartment(payload);
          
          refresh();
          setIsDeptModalOpen(false);
        }} className="space-y-4">
          <Input label="部门名称" name="name" defaultValue={editingDept?.name} required />
          <Input label="负责人姓名" name="managerName" defaultValue={editingDept?.managerName} required />
          <Input label="负责人 ID" name="managerId" defaultValue={editingDept?.managerId} required />
          <Input label="年度预算" name="budget" type="number" defaultValue={editingDept?.budget} required />
          <Select 
            label="上级部门" name="parentId" defaultValue={editingDept?.parentId} 
            options={[{value: '', label: '无'}, ...departments.filter(d => d.id !== editingDept?.id).map(d => ({ value: d.id, label: d.name }))]} 
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsDeptModalOpen(false)}>取消</Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>

      {/* 考勤 Modal */}
      <Modal 
        isOpen={isAttModalOpen} 
        onClose={() => setIsAttModalOpen(false)} 
        title="打卡录入"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData.entries());
          const empId = data.employeeId as string;
          const emp = employees.find(emp => emp.id === empId);
          
          const payload = {
            ...data,
            employeeName: emp?.name || '',
            departmentName: emp?.departmentName || '',
            overtimeHours: Number(data.overtimeHours),
          } as any;

          erpStore.addAttendance(payload);
          refresh();
          setIsAttModalOpen(false);
        }} className="space-y-4">
          <Select 
            label="员工" name="employeeId" required
            options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.departmentName})` }))}
          />
          <Input label="日期" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="签到时间" name="checkIn" type="time" />
            <Input label="签退时间" name="checkOut" type="time" />
          </div>
          <Select label="状态" name="status" options={Object.entries(ATTENDANCE_STATUS).map(([v, s]) => ({value: v, label: s.label}))} />
          <Input label="加班小时" name="overtimeHours" type="number" step="0.5" defaultValue="0" />
          <Input label="备注" name="notes" />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsAttModalOpen(false)}>取消</Button>
            <Button type="submit">提交打卡</Button>
          </div>
        </form>
      </Modal>

      {/* 薪资 Modal */}
      <Modal 
        isOpen={isPayrollModalOpen} 
        onClose={() => setIsPayrollModalOpen(false)} 
        title={editingPayroll ? '编辑薪资单' : '生成薪资单'}
        size="lg"
      >
        <PayrollForm 
          editingItem={editingPayroll} 
          employees={employees} 
          onSave={(payload) => {
            if (editingPayroll) erpStore.updatePayroll(editingPayroll.id, payload);
            else erpStore.addPayroll(payload);
            refresh();
            setIsPayrollModalOpen(false);
          }}
          onCancel={() => setIsPayrollModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

// --- 子组件：处理实发额自动计算的表单 ---
const PayrollForm: React.FC<{ 
  editingItem: PayrollRecord | null; 
  employees: Employee[]; 
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ editingItem, employees, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    employeeId: editingItem?.employeeId || '',
    period: editingItem?.period || new Date().toISOString().substring(0, 7),
    baseSalary: editingItem?.baseSalary || 0,
    overtimePay: editingItem?.overtimePay || 0,
    bonus: editingItem?.bonus || 0,
    deductions: editingItem?.deductions || 0,
    socialInsurance: editingItem?.socialInsurance || 0,
    tax: editingItem?.tax || 0,
    payDate: editingItem?.payDate || '',
    status: editingItem?.status || 'draft',
    notes: editingItem?.notes || ''
  });

  const netSalary = useMemo(() => {
    return formData.baseSalary + formData.overtimePay + formData.bonus - formData.deductions - formData.socialInsurance - formData.tax;
  }, [formData]);

  const handleEmpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const emp = employees.find(emp => emp.id === e.target.value);
    setFormData({ ...formData, employeeId: e.target.value, baseSalary: emp?.baseSalary || 0 });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const emp = employees.find(e => e.id === formData.employeeId);
      onSave({
        ...formData,
        employeeName: emp?.name || '',
        departmentName: emp?.departmentName || '',
        netSalary
      });
    }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="选择员工" value={formData.employeeId} onChange={handleEmpChange} required
          options={[{value: '', label: '请选择员工'}, ...employees.map(e => ({ value: e.id, label: `${e.name} (${e.departmentName})` }))]}
        />
        <Input label="薪资期间" type="month" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="基本薪资" type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} required />
        <Input label="加班费" type="number" value={formData.overtimePay} onChange={e => setFormData({...formData, overtimePay: Number(e.target.value)})} />
        <Input label="奖金" type="number" value={formData.bonus} onChange={e => setFormData({...formData, bonus: Number(e.target.value)})} />
      </div>
      <div className="grid grid-cols-3 gap-4 border-t pt-4">
        <Input label="扣款" type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: Number(e.target.value)})} />
        <Input label="社保代扣" type="number" value={formData.socialInsurance} onChange={e => setFormData({...formData, socialInsurance: Number(e.target.value)})} />
        <Input label="个人所得税" type="number" value={formData.tax} onChange={e => setFormData({...formData, tax: Number(e.target.value)})} />
      </div>
      <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
        <div>
          <p className="text-sm text-blue-600 font-medium">实发总计 (自动计算)</p>
          <p className="text-2xl font-bold text-blue-700">¥{netSalary.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <Badge variant="info">自动同步基本薪资</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="发放日期" type="date" value={formData.payDate} onChange={e => setFormData({...formData, payDate: e.target.value})} />
        <Select 
          label="状态" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
          options={Object.entries(PAYROLL_STATUS).map(([v, s]) => ({value: v, label: s.label}))} 
        />
      </div>
      <Input label="备注" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>
        <Button type="submit">保存单据</Button>
      </div>
    </form>
  );
};

export default HRPage;
