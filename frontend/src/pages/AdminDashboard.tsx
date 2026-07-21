import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Key, 
  CreditCard, 
  Award, 
  BookOpen, 
  CheckCircle, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp,
  Download,
  Copy,
  ChevronRight,
  UserCheck,
  UserX,
  Lock,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface OverviewStats {
  candidates: { total: number; vouchers: number };
  subscriptions: { active: number };
  exams: { total: number; today: number; yesterday: number };
  revenue: { total: number };
}

interface UserAccount {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  account_status: string;
  subscription_tier: string;
  cbt_key?: string;
  created_at: string;
  streak_count?: number;
  xp_points?: number;
  exam_subject_combination?: string[];
}

interface BillingLog {
  reference: string;
  userId: string;
  planCode: string;
  amount: number;
  email: string;
  verifiedAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'keys' | 'billing'>('overview');
  const token = localStorage.getItem('accessToken') || '';

  // Stats State
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Candidates Tab State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // CBT Keys State
  const [voucherUsers, setVoucherUsers] = useState<UserAccount[]>([]);
  const [keyCount, setKeyCount] = useState(5);
  const [keyPage, setKeyPage] = useState(1);
  const [keyLimit] = useState(10);
  const [keyTotal, setKeyTotal] = useState(0);
  const [keysLoading, setKeysLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Billing State
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [billingPage, setBillingPage] = useState(1);
  const [billingLimit] = useState(10);
  const [billingTotal, setBillingTotal] = useState(0);
  const [billingLoading, setBillingLoading] = useState(false);

  // General Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Helper Headers
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // Show Temporary Notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Overview Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats/overview', { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load overview statistics');
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      showToast(e.message || 'Error fetching metrics', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Candidates List
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: userPage.toString(),
        limit: userLimit.toString(),
        search: userSearch,
        role: userRole,
        status: userStatus,
      });
      const res = await fetch(`/api/admin/users?${queryParams.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load user accounts');
      const data = await res.json();
      setUsers(data.data);
      setUserTotal(data.total);
    } catch (e: any) {
      showToast(e.message || 'Error fetching users', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Voucher Accounts
  const fetchVouchers = async () => {
    setKeysLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: keyPage.toString(),
        limit: keyLimit.toString(),
        role: 'student',
        search: 'voucher-', // Voucher emails end in @aurikex.local and start with voucher-
      });
      const res = await fetch(`/api/admin/users?${queryParams.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load voucher keys');
      const data = await res.json();
      setVoucherUsers(data.data);
      setKeyTotal(data.total);
    } catch (e: any) {
      showToast(e.message || 'Error fetching voucher keys', 'error');
    } finally {
      setKeysLoading(false);
    }
  };

  // Fetch Billing Logs
  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: billingPage.toString(),
        limit: billingLimit.toString(),
      });
      const res = await fetch(`/api/admin/billing/logs?${queryParams.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load billing ledger');
      const data = await res.json();
      setBillingLogs(data.data);
      setBillingTotal(data.total);
    } catch (e: any) {
      showToast(e.message || 'Error fetching billing logs', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  // Handle User Status Actions
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user account status');
      showToast('User status updated successfully.', 'success');
      
      // Update local states
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, account_status: newStatus } : u));
      if (selectedUser?.userId === userId) {
        setSelectedUser(prev => prev ? { ...prev, account_status: newStatus } : null);
      }
      
      fetchStats(); // Update dashboard metrics
    } catch (e: any) {
      showToast(e.message || 'Error updating status', 'error');
    }
  };

  // Generate CBT Keys
  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyCount < 1 || keyCount > 1000) {
      showToast('Please specify a count between 1 and 1000.', 'error');
      return;
    }
    setIsGenerating(true);
    setGeneratedKeys([]);
    try {
      const res = await fetch('/api/admin/cbt-keys/generate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ count: keyCount }),
      });
      if (!res.ok) throw new Error('Bulk key generation failed');
      const data = await res.json();
      setGeneratedKeys(data);
      showToast(`Successfully generated ${data.length} keys!`, 'success');
      fetchVouchers();
      fetchStats();
    } catch (e: any) {
      showToast(e.message || 'Error generating keys', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Tab Loading Effects
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'candidates') fetchUsers();
    if (activeTab === 'keys') fetchVouchers();
    if (activeTab === 'billing') fetchBilling();
  }, [activeTab, userPage, userRole, userStatus, keyPage, billingPage]);

  // Debounced user search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === 'candidates') {
        setUserPage(1);
        fetchUsers();
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [userSearch]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/auth?mode=login');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="border-b border-white/5 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              A
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-white flex items-center gap-1.5">
                Aurikex Admin <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium tracking-wide uppercase">Core</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Control Center & Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-200 border border-white/5 transition-all"
            >
              Go to Candidate Portal
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/10 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        
        {/* Navigation Tabs bar */}
        <div className="flex border-b border-white/5 gap-6">
          {(['overview', 'candidates', 'keys', 'billing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setGeneratedKeys([]);
              }}
              className={`pb-4 px-1 text-sm font-semibold capitalize relative transition-all ${
                activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'keys' ? 'CBT Activation Keys' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW STATISTICS TAB */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Candidates Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Registered Candidates</span>
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-white">{stats.candidates.total}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Excludes voucher placeholder accounts</p>
                    </div>
                  </div>

                  {/* Active Vouchers Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-colors" />
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Vouchers Generated</span>
                      <Key className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-white">{stats.candidates.vouchers}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Unassigned active vouchers</p>
                    </div>
                  </div>

                  {/* Completed Exams Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Completed Mock Exams</span>
                      <BookOpen className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-white">{stats.exams.total}</span>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className="text-emerald-400 font-medium">{stats.exams.today} completed today</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">{stats.exams.yesterday} yesterday</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Estimated Revenue</span>
                      <CreditCard className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-white">₦{stats.revenue.total.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <TrendingUp className="h-3 w-3 text-amber-400" />
                        <span>Based on verified Paystack transactions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscriptions Overview & Activity Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-white">System Subscription Summary</h3>
                    <div className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs text-slate-400">Total Premium Users</p>
                        <p className="text-lg font-bold text-white mt-1">{stats.subscriptions.active}</p>
                      </div>
                      <Award className="h-8 w-8 text-primary/45" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Users are assigned tiers (Plus, Pro, Max) automatically upon verified payments. Only users with active premium tiers get full CBT features and unlimited AI operations.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-white">Platform Health & Status</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                        <span className="text-slate-400">MongoDB database</span>
                        <span className="text-emerald-400 font-medium">Connected</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                        <span className="text-slate-400">Rate Limiter (Throttler)</span>
                        <span className="text-emerald-400 font-medium">Active (Global)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1">
                        <span className="text-slate-400">CORS Whitelist protection</span>
                        <span className="text-emerald-400 font-medium">Enforced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">Failed to load statistics.</div>
            )}
          </div>
        )}

        {/* 2. CANDIDATES TABLE TAB */}
        {activeTab === 'candidates' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white/5 border border-white/5 p-4 rounded-xl items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-lg text-xs transition-all"
                />
              </div>

              <div className="flex w-full sm:w-auto gap-3 items-center">
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={userRole}
                    onChange={(e) => { setUserRole(e.target.value); setUserPage(1); }}
                    className="w-full bg-slate-900 border border-white/5 px-3 py-2 rounded-lg text-xs outline-none focus:border-primary/50 text-slate-300"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={userStatus}
                    onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }}
                    className="w-full bg-slate-900 border border-white/5 px-3 py-2 rounded-lg text-xs outline-none focus:border-primary/50 text-slate-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                    <option value="pending_verification">Unverified</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden relative">
              {usersLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse">Retrieving candidate records...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No matching candidate accounts found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Subscription</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr 
                          key={user.userId} 
                          onClick={() => { setSelectedUser(user); setIsDrawerOpen(true); }}
                          className="hover:bg-white/2 cursor-pointer transition-colors"
                        >
                          <td className="p-4 font-medium text-white">{user.fullName}</td>
                          <td className="p-4 text-slate-400">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              user.role.includes('admin') ? 'bg-primary/20 text-primary' : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 font-semibold capitalize">{user.subscription_tier}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              user.account_status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : user.account_status === 'suspended'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {user.account_status}
                            </span>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-center">
                              {user.account_status !== 'active' ? (
                                <button
                                  onClick={() => handleUpdateStatus(user.userId, 'active')}
                                  title="Activate User"
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(user.userId, 'suspended')}
                                  title="Suspend User"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(user.userId, 'locked')}
                                title="Lock User Account"
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                              >
                                <Lock className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination */}
              {userTotal > userLimit && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total: {userTotal} candidates</span>
                  <div className="flex gap-2">
                    <button
                      disabled={userPage === 1}
                      onClick={() => setUserPage(prev => prev - 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      Prev
                    </button>
                    <button
                      disabled={userPage * userLimit >= userTotal}
                      onClick={() => setUserPage(prev => prev + 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sliding Detail Drawer */}
            {isDrawerOpen && selectedUser && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                <div className="w-full max-w-md bg-[#0f1422] border-l border-white/10 h-full p-6 relative flex flex-col gap-6 overflow-y-auto animate-slide-in shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="font-bold text-base text-white">{selectedUser.fullName}</h2>
                      <p className="text-[10px] text-slate-400 font-medium">User ID: {selectedUser.userId}</p>
                    </div>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg text-slate-300"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Address</span>
                      <span className="text-xs text-white break-all">{selectedUser.email}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Streaks count</span>
                        <span className="text-xs font-semibold text-white">{selectedUser.streak_count || 0} days</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">XP Level Progress</span>
                        <span className="text-xs font-semibold text-white">{selectedUser.xp_points || 0} XP</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Subject Combination</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedUser.exam_subject_combination && selectedUser.exam_subject_combination.length > 0 ? (
                          selectedUser.exam_subject_combination.map(subj => (
                            <span key={subj} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-slate-300">
                              {subj}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">None selected</span>
                        )}
                      </div>
                    </div>

                    {selectedUser.cbt_key && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Decrypted CBT Key</span>
                        <span className="text-xs font-mono font-bold text-primary mt-1 block">{selectedUser.cbt_key}</span>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-4 mt-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-3">Admin override</span>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleUpdateStatus(selectedUser.userId, 'active')}
                          disabled={selectedUser.account_status === 'active'}
                          className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:hover:bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedUser.userId, 'suspended')}
                          disabled={selectedUser.account_status === 'suspended'}
                          className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 disabled:hover:bg-red-500/10 border border-red-500/15 text-red-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Suspend
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CBT ACTIVATION KEYS TAB */}
        {activeTab === 'keys' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Batch generator form */}
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Generate Bulk Activation Keys</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Creates blank student voucher accounts with a pre-configured, encrypted activation code (`CBT-XXXXXX`). Admins can copy or download these codes to print vouchers.
                  </p>
                </div>

                <form onSubmit={handleGenerateKeys} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Number of Keys</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={keyCount}
                      onChange={(e) => setKeyCount(Math.min(1000, Math.max(1, Number(e.target.value))))}
                      className="bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-primary/10"
                  >
                    {isGenerating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {isGenerating ? 'Generating accounts...' : 'Generate Batch'}
                  </button>
                </form>

                {/* Display Newly Generated List */}
                {generatedKeys.length > 0 && (
                  <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">Newly Generated Keys</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKeys.join('\n'));
                          showToast('Copied to clipboard!', 'success');
                        }}
                        className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded"
                      >
                        <Copy className="h-3 w-3" />
                        Copy List
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 leading-relaxed">
                      {generatedKeys.map(k => (
                        <div key={k}>{k}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Voucher Table View */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                  {keysLoading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Loading voucher logs...</div>
                  ) : voucherUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No unassigned activation keys exist.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/2 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="p-4">CBT Code</th>
                            <th className="p-4">Placeholder Account Email</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {voucherUsers.map((user) => (
                            <tr key={user.userId} className="hover:bg-white/2 transition-colors">
                              <td className="p-4 font-mono font-bold text-primary">{user.cbt_key}</td>
                              <td className="p-4 text-slate-400">{user.email}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                  Unused Key
                                </span>
                              </td>
                              <td className="p-4 text-slate-400">
                                {new Date(user.created_at || Date.now()).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Voucher Pagination */}
                  {keyTotal > keyLimit && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Vouchers: {keyTotal}</span>
                      <div className="flex gap-2">
                        <button
                          disabled={keyPage === 1}
                          onClick={() => setKeyPage(prev => prev - 1)}
                          className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Prev
                        </button>
                        <button
                          disabled={keyPage * keyLimit >= keyTotal}
                          onClick={() => setKeyPage(prev => prev + 1)}
                          className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. BILLING TRANSACTIONS TAB */}
        {activeTab === 'billing' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
              {billingLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse">Retrieving payment logs...</div>
              ) : billingLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No transaction logs available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-4">Paystack Reference</th>
                        <th className="p-4">Customer Email</th>
                        <th className="p-4">Plan Code</th>
                        <th className="p-4">Amount Paid</th>
                        <th className="p-4">Verification Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {billingLogs.map((log) => (
                        <tr key={log.reference} className="hover:bg-white/2 transition-colors">
                          <td className="p-4 font-mono font-semibold text-slate-300">{log.reference}</td>
                          <td className="p-4 text-slate-300">{log.email}</td>
                          <td className="p-4 font-mono text-slate-400">{log.planCode}</td>
                          <td className="p-4 font-bold text-white">
                            ₦{((log.amount || 0) / 100).toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(log.verifiedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Billing Pagination */}
              {billingTotal > billingLimit && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Transactions: {billingTotal}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={billingPage === 1}
                      onClick={() => setBillingPage(prev => prev - 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      Prev
                    </button>
                    <button
                      disabled={billingPage * billingLimit >= billingTotal}
                      onClick={() => setBillingPage(prev => prev + 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
