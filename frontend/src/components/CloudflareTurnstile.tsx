import React, { useEffect, useRef } from 'react';

interface CloudflareTurnstileProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function CloudflareTurnstile({
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAAx_1234567890Test',
  onVerify,
  onError,
  className = 'my-3 flex justify-center',
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If no siteKey configured, skip silently
    if (!siteKey || siteKey.includes('Test')) return;

    const renderWidget = () => {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify?.(token),
          'error-callback': () => onError?.(),
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      window.onTurnstileLoaded = () => renderWidget();
      script.addEventListener('load', renderWidget);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onError]);

  return <div ref={containerRef} className={className} />;
}
