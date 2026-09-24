import React, { useState, useEffect } from 'react';
import {
  Key,
  RefreshCw,
  Copy,
  Search,
  Download,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { UserAccount } from './types';
import { useToast } from '../../components/ToastProvider';
import { generateCbtKeys, getVouchers } from '../../features/admin/api';

export default function AdminKeys() {
  const [voucherUsers, setVoucherUsers] = useState<UserAccount[]>([]);
  const [keyCount, setKeyCount] = useState(10);
  const [keyPage, setKeyPage] = useState(1);
  const [keyLimit] = useState(10);
  const [keyTotal, setKeyTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [keysLoading, setKeysLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { addToast } = useToast();

  const fetchVouchers = async () => {
    setKeysLoading(true);
    try {
      const data = await getVouchers({
        page: keyPage,
        limit: keyLimit,
        search: searchQuery.trim() || undefined,
      });
      setVoucherUsers(data.data || []);
      setKeyTotal(data.total || 0);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message || 'Error fetching voucher keys',
      });
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVouchers();
    }, 350);
    return () => clearTimeout(handler);
  }, [keyPage, searchQuery]);

  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyCount < 1 || keyCount > 1000) {
      addToast({
        type: 'error',
        title: 'Invalid Count',
        message: 'Please specify a count between 1 and 1000.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const data = await generateCbtKeys(keyCount);
      setGeneratedKeys(data);
      setShowGeneratedModal(true);
      addToast({
        type: 'success',
        title: 'Keys Generated',
        message: `Successfully generated ${data.length} activation keys!`,
      });
      fetchVouchers();
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: e.response?.data?.message || e.message || 'Error generating keys',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label = 'Key') => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
  };

  const copyAllGenerated = () => {
    if (generatedKeys.length === 0) return;
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    addToast({
      type: 'success',
      title: 'All Copied',
      message: `${generatedKeys.length} keys copied to clipboard.`,
    });
  };

  const downloadCsv = () => {
    if (generatedKeys.length === 0) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Index,Activation_Key,Generated_Date,Status\n' +
      generatedKeys
        .map((k, i) => `${i + 1},${k},${dateStr},Unassigned`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aurikrex_cbt_keys_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      type: 'success',
      title: 'CSV Downloaded',
      message: 'Exported key batch to CSV file.',
    });
  };

  const totalPages = Math.ceil(keyTotal / keyLimit) || 1;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Page Title & Bulk Generation Form */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Activation Keys & Vouchers
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Generate and export batch access keys for schools, test centers, or offline distribution ({keyTotal.toLocaleString()} available).
          </p>
        </div>

        {/* Bulk Key Generator Card */}
        <form
          onSubmit={handleGenerateKeys}
          className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-bg-card p-2 rounded-2xl border border-border shadow-sm w-full lg:w-auto"
        >
          <div className="flex items-center gap-2 px-3 py-1 border-r border-border w-full sm:w-auto">
            <Key className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-text-muted">Batch:</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={keyCount}
              onChange={(e) => setKeyCount(parseInt(e.target.value) || 0)}
              className="w-16 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Keys</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search key code or voucher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setKeyPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-bg-card border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border">
          {keysLoading ? (
            <div className="py-12 text-center text-text-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              Loading activation keys...
            </div>
          ) : voucherUsers.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No activation keys or vouchers found.
            </div>
          ) : (
            voucherUsers.map((voucher) => (
              <div key={voucher.userId} className="p-4 space-y-3 hover:bg-bg-secondary/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      Voucher Code
                    </div>
                    <div className="font-mono text-base font-bold text-amber-400 mt-0.5">
                      {voucher.cbt_key || voucher.email.split('@')[0]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(voucher.cbt_key || voucher.email, 'Key')}
                    className="p-2 rounded-xl bg-bg-secondary hover:bg-primary/10 text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-text-muted">
                  <span>Created: {new Date(voucher.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Unassigned
                  </span>
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
                <th className="px-6 py-4">Activation Key</th>
                <th className="px-6 py-4">Account Reference</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Generated Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {keysLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Loading voucher keys...
                  </td>
                </tr>
              ) : voucherUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No voucher keys found matching criteria.
                  </td>
                </tr>
              ) : (
                voucherUsers.map((voucher) => {
                  const keyString = voucher.cbt_key || voucher.email.split('@')[0];
                  return (
                    <tr key={voucher.userId} className="hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Key className="h-4 w-4 text-amber-400" />
                          <span className="font-mono text-sm font-bold text-text-primary">
                            {keyString}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-text-muted">
                        {voucher.email}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          Unassigned (Ready)
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-text-muted">
                        {new Date(voucher.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(keyString, 'Key')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted bg-bg-card">
          <div>
            Showing <span className="font-bold text-text-primary">{voucherUsers.length}</span> of{' '}
            <span className="font-bold text-text-primary">{keyTotal}</span> voucher keys (Page {keyPage} of{' '}
            {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={keyPage <= 1 || keysLoading}
              onClick={() => setKeyPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-bold text-text-primary bg-bg-secondary rounded-lg border border-border">
              {keyPage}
            </span>
            <button
              type="button"
              disabled={keyPage >= totalPages || keysLoading}
              onClick={() => setKeyPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-border hover:bg-bg-secondary text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Generated Keys Modal */}
      {showGeneratedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Generated {generatedKeys.length} CBT Keys
                  </h3>
                  <p className="text-xs text-text-muted">
                    Keys are ready for distribution to students and centers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneratedModal(false)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copyAllGenerated}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-bg-secondary hover:bg-border text-text-primary transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copy All Keys</span>
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV</span>
              </button>
            </div>

            {/* Key List Viewer */}
            <div className="flex-1 overflow-y-auto max-h-64 border border-border rounded-2xl bg-bg-secondary/40 p-3 space-y-1.5 custom-scrollbar">
              {generatedKeys.map((k, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-xl bg-bg-card border border-border/60 hover:border-primary/40 text-xs font-mono"
                >
                  <span className="text-text-primary font-bold">{k}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(k, 'Key')}
                    className="p-1 rounded-md text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowGeneratedModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
