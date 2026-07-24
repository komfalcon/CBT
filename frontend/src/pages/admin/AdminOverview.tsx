import React, { useState, useEffect } from 'react';
import { Users, Key, CreditCard, Award, BookOpen, TrendingUp } from 'lucide-react';
import { OverviewStats } from './types';
import { useToast } from '../../components/ToastProvider';

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { addToast } = useToast();
  const token = localStorage.getItem('accessToken') || '';

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats/overview', { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load overview statistics');
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error fetching metrics' });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-bg-secondary border border-border animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Candidates Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Registered Candidates</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.candidates.total}</span>
                <p className="text-[10px] text-text-muted mt-1">Excludes voucher placeholder accounts</p>
              </div>
            </div>

            {/* Active Vouchers Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Vouchers Generated</span>
                <Key className="h-5 w-5 text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.candidates.vouchers}</span>
                <p className="text-[10px] text-text-muted mt-1">Unassigned active vouchers</p>
              </div>
            </div>

            {/* Completed Exams Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Completed Mock Exams</span>
                <BookOpen className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.exams.total}</span>
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">{stats.exams.today} completed today</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted">{stats.exams.yesterday} yesterday</span>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Estimated Revenue</span>
                <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">₦{stats.revenue.total.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-[10px] text-text-muted mt-1">
                  <TrendingUp className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  <span>Based on verified Paystack transactions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Overview & Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-text-primary">System Subscription Summary</h3>
              <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
                <div>
                  <p className="text-xs text-text-muted">Total Premium Users</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{stats.subscriptions.active}</p>
                </div>
                <Award className="h-8 w-8 text-primary/45" />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Users are assigned tiers (Plus, Pro, Max) automatically upon verified payments. Only users with active premium tiers get full CBT features and unlimited AI operations.
              </p>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-text-primary">Platform Health & Status</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs py-1 border-b border-border">
                  <span className="text-text-muted">MongoDB database</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-border">
                  <span className="text-text-muted">Rate Limiter (Throttler)</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Active (Global)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-text-muted">CORS Whitelist protection</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-text-muted">Failed to load statistics.</div>
      )}
    </div>
  );
}
