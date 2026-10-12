import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Copy,
  Search,
  X,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { BillingLog } from './types';
import { useToast } from '../../components/ToastProvider';
import { getBillingLedger } from '../../features/admin/api';

export default function AdminBilling() {
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [billingPage, setBillingPage] = useState(1);
  const [billingLimit] = useState(10);
  const [billingTotal, setBillingTotal] = useState(0);
  const [billingLoading, setBillingLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const { addToast } = useToast();

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const data = await getBillingLedger({
        page: billingPage,
        limit: billingLimit,
      });
      setBillingLogs(data.data || []);
      setBillingTotal(data.total || 0);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message || 'Error fetching billing ledger',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, [billingPage]);

  const copyToClipboard = (text: string, label = 'Reference') => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
  };

  const totalPages = Math.ceil(billingTotal / billingLimit) || 1;

  // Filter logs by reference or email
  const filteredLogs = billingLogs.filter((log) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      log.reference.toLowerCase().includes(term) ||
      log.email.toLowerCase().includes(term) ||
      log.planCode.toLowerCase().includes(term)
    );
  });

  const totalCalculatedVolume = billingLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Title & Beta Banner */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
          Billing & Subscription Ledger
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Historical payment records and verified transaction ledger from the Paystack gateway.
        </p>
      </div>

      {/* Public Beta Status Notice */}
      <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
              Free Public Beta Active — Paywalls Paused
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              All students have full mock exam access and 20 daily Falke AI messages free of charge. Subscriptions will activate upon commercial launch.
            </div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 shrink-0">
          Beta Guarantee
        </span>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Total Ledger Volume
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              ₦{totalCalculatedVolume.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Verified Transactions
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              {billingTotal.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Gateway Provider
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              Paystack
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Filter by ref, email, or plan..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-bg-card border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border">
          {billingLoading ? (
            <div className="py-12 text-center text-text-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              Loading billing ledger...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No verified transactions found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.reference} className="p-4 space-y-3 hover:bg-bg-secondary/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      Reference
                    </div>
                    <div className="font-mono text-xs font-bold text-text-primary truncate mt-0.5">
                      {log.reference}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(log.reference, 'Reference')}
                    className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/10 text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-text-primary">
                    ₦{log.amount.toLocaleString()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {log.planCode.replace('PLN_', '')}
                  </span>
                </div>

                <div className="text-xs text-text-secondary truncate">
                  Customer: {log.email}
                </div>

                <div className="text-[11px] text-text-muted pt-1 border-t border-border/50">
                  Verified: {new Date(log.verifiedAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-bg-secondary/60 text-text-muted font-bold text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Transaction Reference</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Tier Plan</th>
                <th className="px-6 py-4">Customer Account</th>
                <th className="px-6 py-4">Verified At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {billingLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No verified transaction records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.reference} className="hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span>{log.reference}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-black text-text-primary">
                      ₦{log.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25">
                        {log.planCode.replace('PLN_', '')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {log.email}
                    </td>

                    <td className="px-6 py-4 text-xs text-text-muted">
                      {new Date(log.verifiedAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(log.reference, 'Reference')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Ref</span>
                      </button>
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
            Showing <span className="font-bold text-text-primary">{filteredLogs.length}</span> of{' '}
            <span className="font-bold text-text-primary">{billingTotal}</span> transactions (Page{' '}
            {billingPage} of {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={billingPage <= 1 || billingLoading}
              onClick={() => setBillingPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-bold text-text-primary bg-bg-secondary rounded-lg border border-border">
              {billingPage}
            </span>
            <button
              type="button"
              disabled={billingPage >= totalPages || billingLoading}
              onClick={() => setBillingPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
