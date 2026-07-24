import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, Copy, Search } from 'lucide-react';
import { UserAccount } from './types';
import { useToast } from '../../components/ToastProvider';

export default function AdminKeys() {
  const [voucherUsers, setVoucherUsers] = useState<UserAccount[]>([]);
  const [keyCount, setKeyCount] = useState(5);
  const [keyPage, setKeyPage] = useState(1);
  const [keyLimit] = useState(10);
  const [keyTotal, setKeyTotal] = useState(0);
  const [keysLoading, setKeysLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();
  const token = localStorage.getItem('accessToken') || '';

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

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
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error fetching voucher keys' });
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [keyPage]);

  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyCount < 1 || keyCount > 1000) {
      addToast({ type: 'error', title: 'Error', message: 'Please specify a count between 1 and 1000.' });
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
      addToast({ type: 'success', title: 'Success', message: `Successfully generated ${data.length} keys!` });
      fetchVouchers();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error generating keys' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: 'Key copied to clipboard' });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-text-primary">Activation Keys</h2>
        
        <form onSubmit={handleGenerateKeys} className="flex items-center gap-3 bg-bg-card p-2 rounded-xl border border-border w-full sm:w-auto">
          <div className="flex items-center gap-2 px-2 border-r border-border">
            <Key className="h-4 w-4 text-text-muted" />
            <input
              type="number"
              min="1"
              max="1000"
              value={keyCount}
              onChange={(e) => setKeyCount(parseInt(e.target.value) || 0)}
              className="w-16 bg-transparent text-sm font-semibold text-text-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Generate Keys</span>}
          </button>
        </form>
      </div>

      {generatedKeys.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-2">
          <h3 className="text-emerald-500 font-bold mb-3 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Newly Generated Keys ({generatedKeys.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {generatedKeys.map((k, i) => (
              <div key={i} className="flex items-center justify-between bg-bg-card border border-emerald-500/20 p-2.5 rounded-xl">
                <code className="text-sm font-mono font-bold tracking-wider text-text-primary">{k}</code>
                <button onClick={() => copyToClipboard(k)} className="text-text-muted hover:text-emerald-500 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-secondary text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Voucher ID (Email)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {keysLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-text-muted">Loading vouchers...</td>
                </tr>
              ) : voucherUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-text-muted">No vouchers generated yet.</td>
                </tr>
              ) : (
                voucherUsers.map(user => (
                  <tr key={user.userId} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {user.account_status === 'active' ? 'Unused' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(user.created_at).toLocaleString()}
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
            Showing {voucherUsers.length} of {keyTotal} vouchers
          </span>
          <div className="flex gap-2">
            <button
              disabled={keyPage === 1}
              onClick={() => setKeyPage(p => p - 1)}
              className="px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg disabled:opacity-50 hover:bg-bg-secondary/80 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={keyPage * keyLimit >= keyTotal}
              onClick={() => setKeyPage(p => p + 1)}
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
