import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export function CbtLogo({ size = 22 }: { size?: number }) {
  return <img src="/aurikrex-logo.png" alt="Aurikrex CBT" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />;
}

export function LibraryLogo({ size = 22 }: { size?: number }) {
  return <img src="/library-logo.png" alt="Aurikrex Library" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />;
}

export function BytesLogo({ size = 22 }: { size?: number }) {
  return <img src="/bytes-logo.svg" alt="Aurikrex Bytes" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />;
}

export function PhoryntLogo({ size = 22 }: { size?: number }) {
  return <img src="/phorynt-logo.svg" alt="Aurikrex Phorynt" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />;
}

export interface AppOption {
  id: string;
  name: string;
  description: string;
  defaultUrl: string;
  clientId: string;
  redirectUri: string;
  icon: React.ReactNode;
}

const AURIKREX_APPS: AppOption[] = [
  {
    id: 'cbt',
    name: 'Aurikrex CBT',
    description: 'JAMB UTME Exam Arena & Practice',
    defaultUrl: 'https://cbt.aurikrex.com',
    clientId: 'aurikrex_cbt',
    redirectUri: 'https://cbt.aurikrex.com',
    icon: <CbtLogo size={22} />,
  },
  {
    id: 'library',
    name: 'Aurikrex Library',
    description: 'Digital E-Library & Academic Resources',
    defaultUrl: 'https://library.aurikrex.com',
    clientId: 'aurikrex_library',
    redirectUri: 'https://library.aurikrex.com/sso/callback',
    icon: <LibraryLogo size={22} />,
  },
  {
    id: 'bytes',
    name: 'Aurikrex Bytes',
    description: 'Bite-Sized Summaries & Study Flashcards',
    defaultUrl: 'https://bytes.aurikrex.com',
    clientId: 'aurikrex_bytes',
    redirectUri: 'https://bytes.aurikrex.com/sso/callback',
    icon: <BytesLogo size={22} />,
  },
  {
    id: 'vault',
    name: 'Aurikrex Phorynt',
    description: 'Interactive STEM & Exam Prep Vault',
    defaultUrl: 'https://phorynt.aurikrex.com',
    clientId: 'aurikrex_vault',
    redirectUri: 'https://phorynt.aurikrex.com/sso/callback',
    icon: <PhoryntLogo size={22} />,
  },
];

export function getSanitizedCbtBackendUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api';
  }
  return 'https://cbt.aurikrex.com';
}

export function AurikrexAppsSwitcher({ currentAppId = 'cbt', iconOnly = false }: { currentAppId?: 'cbt' | 'library' | 'bytes' | 'vault'; iconOnly?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTargetUrl = (app: AppOption): string => {
    if (app.id === currentAppId) return app.defaultUrl;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const apiBase = getSanitizedCbtBackendUrl();

    if (token && app.id !== 'cbt') {
      const endpoint = apiBase.endsWith('/api/v1') ? `${apiBase}/auth/sso/authorize` : `${apiBase}/api/v1/auth/sso/authorize`;
      return `${endpoint}?client_id=${app.clientId}&redirect_uri=${encodeURIComponent(app.redirectUri)}&token=${encodeURIComponent(token)}`;
    }
    return app.defaultUrl;
  };

  const dropdownStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: '68px',
        left: '12px',
        right: '12px',
        maxWidth: '340px',
        margin: '0 auto',
        borderRadius: '16px',
        backgroundColor: 'var(--color-bg-card, #111d34)',
        borderColor: 'var(--color-border, rgba(156, 172, 201, 0.14))',
        borderStyle: 'solid',
        borderWidth: '1px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 99999,
        overflow: 'hidden',
        textAlign: 'left',
      }
    : {
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: '280px',
        borderRadius: '12px',
        backgroundColor: 'var(--color-bg-card, #111d34)',
        borderColor: 'var(--color-border, rgba(156, 172, 201, 0.14))',
        borderStyle: 'solid',
        borderWidth: '1px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        overflow: 'hidden',
        textAlign: 'left',
      };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={
          iconOnly
            ? "p-2 text-text-secondary hover:text-text-primary hover:bg-surface-container rounded-lg border border-border/50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-center shrink-0"
            : "flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-card border border-border rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        }
        title="Aurikrex Ecosystem Apps"
      >
        <span className="inline-flex items-center justify-center shrink-0">
          <img src="/aurikrex-logo.png" alt="Aurikrex Logo" className="w-4 h-4 object-contain rounded" />
        </span>
        {!iconOnly && (
          <span className="whitespace-nowrap">
            {isMobile ? 'Apps' : 'Aurikrex Apps'}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={dropdownStyle} className="text-text-primary">
          <div className="p-3 border-b border-border bg-surface-container-low">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Aurikrex Ecosystem</p>
            <p className="text-[11px] text-text-secondary mt-0.5">One identity across all applications</p>
          </div>

          <div className="p-1.5 space-y-1">
            {AURIKREX_APPS.map((app) => {
              const isCurrent = app.id === currentAppId;
              return (
                <a
                  key={app.id}
                  href={getTargetUrl(app)}
                  target={isCurrent ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="shrink-0 mt-0.5">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary group-hover:text-primary flex items-center gap-1">
                        {app.name}
                        {!isCurrent && <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-tertiary border border-tertiary/30 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{app.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
