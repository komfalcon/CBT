import React, { useState, useEffect } from 'react';
import { CreditCard, Copy } from 'lucide-react';
import { BillingLog } from './types';
import { useToast } from '../../components/ToastProvider';

export default function AdminBilling() {
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [billingPage, setBillingPage] = useState(1);
  const [billingLimit] = useState(10);
  const [billingTotal, setBillingTotal] = useState(0);
  const [billingLoading, setBillingLoading] = useState(false);
  const { addToast } = useToast();
  const token = localStorage.getItem('accessToken') || '';

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: billingPage.toString(),
        limit: billingLimit.toString(),
      });
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/admin/billing/logs?${queryParams.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load billing ledger');
      const data = await res.json();
      setBillingLogs(data.data);
      setBillingTotal(data.total);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error fetching billing logs' });
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, [billingPage]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: 'Reference copied to clipboard' });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Billing Ledger</h2>
      </div>

      <div className="flex-1 bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="md:hidden flex-1 p-4 space-y-3 overflow-y-auto">
          {billingLoading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading ledger...</div>
          ) : billingLogs.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No verified transactions found.</div>
          ) : (
            billingLogs.map((log) => (
              <div key={log.reference} className="rounded-xl border border-border bg-bg-secondary/40 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-mono text-xs break-all">{log.reference}</span>
                  </div>
                  <button onClick={() => copyToClipboard(log.reference)} className="text-text-muted hover:text-primary transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-sm font-bold text-text-primary">₦{log.amount.toLocaleString()}</div>
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  log.planCode === 'PLN_plus' ? 'bg-indigo-500/10 text-indigo-500' :
                  log.planCode === 'PLN_pro' ? 'bg-purple-500/10 text-purple-500' :
                  log.planCode === 'PLN_max' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-slate-500/10 text-slate-500'
                }`}>
                  {log.planCode.replace('PLN_', '')}
                </span>
                <div className="text-xs text-text-secondary break-all">{log.email}</div>
                <div className="text-xs text-text-muted">Verified: {new Date(log.verifiedAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-secondary text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction Ref</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Customer Email</th>
                <th className="px-6 py-4">Verified At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {billingLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading ledger...</td>
                </tr>
              ) : billingLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No verified transactions found.</td>
                </tr>
              ) : (
                billingLogs.map(log => (
                  <tr key={log.reference} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs">{log.reference}</span>
                        <button onClick={() => copyToClipboard(log.reference)} className="text-text-muted hover:text-primary transition-colors">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      ₦{log.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        log.planCode === 'PLN_plus' ? 'bg-indigo-500/10 text-indigo-500' :
                        log.planCode === 'PLN_pro' ? 'bg-purple-500/10 text-purple-500' :
                        log.planCode === 'PLN_max' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {log.planCode.replace('PLN_', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.email}</td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(log.verifiedAt).toLocaleString()}
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
            Showing {billingLogs.length} of {billingTotal} transactions
          </span>
          <div className="flex gap-2">
            <button
              disabled={billingPage === 1}
              onClick={() => setBillingPage(p => p - 1)}
              className="px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg disabled:opacity-50 hover:bg-bg-secondary/80 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={billingPage * billingLimit >= billingTotal}
              onClick={() => setBillingPage(p => p + 1)}
              className="px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg disabled:opacity-50 hover:bg-bg-secondary/80 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
