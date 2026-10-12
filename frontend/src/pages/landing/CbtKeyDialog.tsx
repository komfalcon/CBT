import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { loginWithCbtKey } from '../../features/auth/api';
import { ActionLink } from './ActionLink';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Native <dialog> modal for CBT key authentication.
 * Formatted with responsive padding, touch-friendly inputs, landscape containment, and clear keyboard support.
 */
export function CbtKeyDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const uid = useId();
  const inputId = `${uid}-key`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const reset = () => {
    setValue('');
    setError('');
    setBusy(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const key = value.trim();
    if (!key) {
      setError('Enter your CBT key to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await loginWithCbtKey({ cbtKey: key });
      onClose();
      navigate('/dashboard');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Invalid or unverified CBT Access Key.');
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${uid}-title`}
      onClose={() => {
        reset();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-bg-card p-0 text-text-primary shadow-2xl backdrop:bg-overlay backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="p-5 sm:p-6" noValidate>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${uid}-title`} className="font-display text-lg font-semibold sm:text-xl">
            Sign in with your CBT key
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1.5 -mt-1.5 inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-body-md">
          Your CBT key was created with your account. Enter it to go straight to your dashboard.
        </p>

        {/* Form controls */}
        <div className="mt-4 sm:mt-5">
          <label htmlFor={inputId} className="block text-xs font-medium text-text-primary sm:text-sm">
            CBT key
          </label>
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="CBT-XXXXXX"
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            aria-invalid={error ? true : undefined}
            className="mt-1.5 min-h-[44px] w-full rounded-lg border border-border bg-bg-secondary px-3.5 font-mono text-sm tracking-wider text-text-primary placeholder:text-text-tertiary focus:border-accent-royal-blue focus:outline-none sm:text-base"
          />
          <p id={hintId} className="mt-1.5 text-xs text-text-secondary sm:text-sm">
            Format: CBT-XXXXXX (case-insensitive)
          </p>
          <p id={errorId} role="alert" className="mt-1.5 min-h-5 text-xs text-error sm:text-sm">
            {error}
          </p>
        </div>

        {/* Actions with 44px min touch targets */}
        <div className="mt-4 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <ActionLink onClick={onClose} size="md" className="w-full sm:w-auto">
            Cancel
          </ActionLink>
          <ActionLink variant="primary" type="submit" size="md" disabled={busy} className="w-full sm:w-auto">
            {busy ? 'Checking key…' : 'Sign in'}
          </ActionLink>
        </div>
      </form>
    </dialog>
  );
}
