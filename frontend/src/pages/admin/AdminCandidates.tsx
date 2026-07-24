import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, UserCheck, UserX, Copy } from 'lucide-react';
import { UserAccount } from './types';
import { useToast } from '../../components/ToastProvider';

export default function AdminCandidates() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const { addToast } = useToast();
  const token = localStorage.getItem('accessToken') || '';

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

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
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error fetching users' });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(handler);
  }, [userPage, userSearch, userRole, userStatus]);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user account status');
      addToast({ type: 'success', title: 'Success', message: 'User status updated successfully.' });
      
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, account_status: newStatus } : u));
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error updating status' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: 'Copied to clipboard' });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold text-text-primary">Candidates</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search email or name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted hidden sm:block" />
            <select
              value={userRole}
              onChange={(e) => { setUserRole(e.target.value); setUserPage(1); }}
              className="bg-bg-secondary border border-border rounded-xl text-sm text-text-primary px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={userStatus}
              onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }}
              className="bg-bg-secondary border border-border rounded-xl text-sm text-text-primary px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-secondary text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role & Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading candidates...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No candidates found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.userId} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{user.fullName}</span>
                        <span className="text-xs text-text-muted flex items-center gap-2">
                          {user.email}
                          <button onClick={() => copyToClipboard(user.email)} className="hover:text-primary transition-colors">
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-text-secondary'
                        }`}>
                          {user.role}
                        </span>
                        {user.role === 'student' && (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            user.subscription_tier === 'plus' ? 'bg-indigo-500/10 text-indigo-500' :
                            user.subscription_tier === 'pro' ? 'bg-purple-500/10 text-purple-500' :
                            user.subscription_tier === 'max' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {user.subscription_tier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${
                        user.account_status === 'active' 
                          ? 'text-emerald-500 bg-emerald-500/10' 
                          : 'text-red-500 bg-red-500/10'
                      }`}>
                        {user.account_status === 'active' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        user.account_status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(user.userId, 'suspended')}
                            className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(user.userId, 'active')}
                            className="inline-flex items-center justify-center p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Activate User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-bg-card">
          <span className="text-xs text-text-muted">
            Showing {users.length} of {userTotal} entries
          </span>
          <div className="flex gap-2">
            <button
              disabled={userPage === 1}
              onClick={() => setUserPage(p => p - 1)}
              className="px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-secondary/80 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={userPage * userLimit >= userTotal}
              onClick={() => setUserPage(p => p + 1)}
              className="px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-secondary/80 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
