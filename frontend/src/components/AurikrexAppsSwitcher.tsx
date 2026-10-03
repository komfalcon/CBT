import React, { useState, useRef, useEffect } from 'react';
import { Grid, ExternalLink, BookOpen, FileText, Monitor } from 'lucide-react';

export interface AppOption {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
}

const AURIKREX_APPS: AppOption[] = [
  {
    name: 'Aurikrex CBT',
    description: 'JAMB UTME Exam Arena & Adaptive Practice',
    url: 'https://cbt.aurikrex.com',
    icon: <Monitor className="w-5 h-5 text-blue-400" />,
    badge: 'Active',
  },
  {
    name: 'Aurikrex Library',
    description: 'Digital E-Library & Academic Resources',
    url: 'https://library.aurikrex.com/sso/login?client_id=aurikrex_library',
    icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
  },
  {
    name: 'Aurikrex Bytes',
    description: 'Bite-Sized Summaries & Study Flashcards',
    url: 'https://bytes.aurikrex.com/sso/login?client_id=aurikrex_bytes',
    icon: <FileText className="w-5 h-5 text-amber-400" />,
  },
];

export function AurikrexAppsSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        title="Aurikrex Ecosystem Apps"
      >
        <Grid className="w-4 h-4 text-blue-400" />
        <span className="hidden sm:inline">Aurikrex Apps</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aurikrex Ecosystem</p>
            <p className="text-[11px] text-slate-500 mt-0.5">One identity across all applications</p>
          </div>

          <div className="p-1.5 space-y-1">
            {AURIKREX_APPS.map((app) => (
              <a
                key={app.name}
                href={app.url}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white flex items-center gap-1">
                      {app.name}
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    {app.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                        {app.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{app.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
