import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  UserX,
  Copy,
  X,
  Eye,
  CheckCircle2,
  Calendar,
  Zap,
  Flame,
  Key,
  BookOpen,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { UserAccount } from './types';
import { useToast } from '../../components/ToastProvider';
import { getCandidates, updateCandidateStatus } from '../../features/admin/api';

export default function AdminCandidates() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    user: UserAccount;
    newStatus: 'active' | 'suspended';
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { addToast } = useToast();

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await getCandidates({
        page: userPage,
        limit: userLimit,
        search: userSearch.trim(),
        role: userRole || undefined,
        status: userStatus || undefined,
      });
      setUsers(data.data || []);
      setUserTotal(data.total || 0);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message || 'Error fetching candidates list',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 350);
    return () => clearTimeout(handler);
  }, [userPage, userSearch, userRole, userStatus]);

  const handleConfirmStatusChange = async () => {
    if (!confirmModal) return;
    const { user, newStatus } = confirmModal;
    setStatusUpdating(true);
    try {
      await updateCandidateStatus(user.userId, newStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Candidate account has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
      });
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, account_status: newStatus } : u)),
      );
      if (selectedUser && selectedUser.userId === user.userId) {
        setSelectedUser((prev) => (prev ? { ...prev, account_status: newStatus } : null));
      }
      setConfirmModal(null);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message || 'Error updating status',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
  };

  const totalPages = Math.ceil(userTotal / userLimit) || 1;

  const getInitials = (name: string) => {
    if (!name) return 'CA';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Registered Candidates
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage UTME candidate profiles, credentials, and access permissions ({userTotal.toLocaleString()} total).
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-bg-card border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors shadow-sm"
            />
            {userSearch && (
              <button
                type="button"
                onClick={() => setUserSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <select
            value={userRole}
            onChange={(e) => {
              setUserRole(e.target.value);
              setUserPage(1);
            }}
            className="bg-bg-card border border-border rounded-xl text-xs sm:text-sm text-text-primary px-3 py-2.5 outline-none focus:border-primary cursor-pointer shadow-sm"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={userStatus}
            onChange={(e) => {
              setUserStatus(e.target.value);
              setUserPage(1);
            }}
            className="bg-bg-card border border-border rounded-xl text-xs sm:text-sm text-text-primary px-3 py-2.5 outline-none focus:border-primary cursor-pointer shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Mobile View: Touch Cards */}
        <div className="md:hidden divide-y divide-border">
          {usersLoading ? (
            <div className="py-12 text-center text-text-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              Loading candidate records...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No candidates found matching the active filters.
            </div>
          ) : (
            users.map((user) => (
              <div key={user.userId} className="p-4 space-y-3.5 hover:bg-bg-secondary/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-text-primary text-sm truncate">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-text-muted truncate break-all flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{user.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                          className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="p-2 rounded-lg bg-bg-secondary hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.account_status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {user.account_status}
                    </span>
                  </div>

                  {user.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          user,
                          newStatus: user.account_status === 'active' ? 'suspended' : 'active',
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        user.account_status === 'active'
                          ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                      }`}
                    >
                      {user.account_status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Dense Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-bg-secondary/60 text-text-muted font-bold text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role & Tier</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Registration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Loading candidates...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No candidate records found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <span>{user.fullName}</span>
                            {user.cbt_key && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                                KEY
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                            <span>{user.email}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.email, 'Email')}
                              className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                              title="Copy email"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-primary/15 text-primary border border-primary/30'
                              : 'bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                        {user.role === 'student' && (
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Max Beta Tier
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.account_status === 'active'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/25'
                        }`}
                      >
                        {user.account_status === 'active' ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                        <span className="capitalize">{user.account_status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-text-muted">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          title="View profile details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {user.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                user,
                                newStatus: user.account_status === 'active' ? 'suspended' : 'active',
                              })
                            }
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              user.account_status === 'active'
                                ? 'text-rose-400 hover:bg-rose-500/15'
                                : 'text-emerald-400 hover:bg-emerald-500/15'
                            }`}
                            title={user.account_status === 'active' ? 'Suspend Candidate' : 'Activate Candidate'}
                          >
                            {user.account_status === 'active' ? (
                              <ShieldAlert className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted bg-bg-card">
          <div>
            Showing <span className="font-bold text-text-primary">{users.length}</span> of{' '}
            <span className="font-bold text-text-primary">{userTotal}</span> candidates (Page {userPage} of{' '}
            {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={userPage <= 1 || usersLoading}
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-bold text-text-primary bg-bg-secondary rounded-lg border border-border">
              {userPage}
            </span>
            <button
              type="button"
              disabled={userPage >= totalPages || usersLoading}
              onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white font-black text-base flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  {getInitials(selectedUser.fullName)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selectedUser.fullName}</h3>
                  <p className="text-xs text-text-muted">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-bg-secondary/60 border border-border">
                <div className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Role
                </div>
                <div className="text-xs font-bold text-text-primary capitalize mt-1">
                  {selectedUser.role}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-bg-secondary/60 border border-border">
                <div className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Status
                </div>
                <div className="text-xs font-bold text-emerald-400 capitalize mt-1">
                  {selectedUser.account_status}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-bg-secondary/60 border border-border col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" /> Tier
                </div>
                <div className="text-xs font-bold text-amber-400 uppercase mt-1">
                  {selectedUser.subscription_tier || 'Max (Beta)'}
                </div>
              </div>
            </div>

            {/* Credential & Exam Details */}
            <div className="space-y-3 text-xs">
              {selectedUser.cbt_key && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" /> Assigned CBT Access Key
                    </div>
                    <div className="font-mono text-sm font-bold text-amber-800 dark:text-amber-300 mt-1">
                      {selectedUser.cbt_key}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedUser.cbt_key!, 'CBT Key')}
                    className="p-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500 hover:text-white dark:hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Subjects */}
              <div className="p-4 rounded-2xl bg-bg-secondary/60 border border-border space-y-2">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Registered UTME Subjects
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.exam_subject_combination && selectedUser.exam_subject_combination.length > 0 ? (
                    selectedUser.exam_subject_combination.map((subj, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 capitalize"
                      >
                        {subj}
                      </span>
                    ))
                  ) : (
                    <span className="text-text-muted text-xs">Standard UTME Combination default</span>
                  )}
                </div>
              </div>

              {/* Engagement telemetry */}
              <div className="p-4 rounded-2xl bg-bg-secondary/60 border border-border grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <div>
                    <div className="text-[10px] text-text-muted">Daily Streak</div>
                    <div className="font-bold text-text-primary">{selectedUser.streak_count || 0} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-text-muted">Earned XP</div>
                    <div className="font-bold text-text-primary">{selectedUser.xp_points || 0} pts</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-2">
                <span>Account Created:</span>
                <span className="font-semibold text-text-primary">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-bg-secondary text-text-primary hover:bg-border transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspension / Activation */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  confirmModal.newStatus === 'suspended'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {confirmModal.newStatus === 'suspended' ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <UserCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {confirmModal.newStatus === 'suspended'
                    ? 'Suspend Candidate Account?'
                    : 'Reactivate Candidate Account?'}
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Are you sure you want to change the account status for{' '}
                  <span className="font-bold text-text-primary">{confirmModal.user.fullName}</span> (
                  {confirmModal.user.email}) to{' '}
                  <span className="font-bold uppercase text-text-primary">{confirmModal.newStatus}</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleConfirmStatusChange}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  confirmModal.newStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                }`}
              >
                {statusUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>{confirmModal.newStatus === 'suspended' ? 'Confirm Suspension' : 'Confirm Activation'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
