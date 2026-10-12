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
 * Native <dialog> gives Escape-to-close, focus trapping and inert background for free.
 * The key is sent straight to the API instead of being placed in a URL.
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
    if (!open && dialog.open) dialog.close();
    if (!open) document.body.style.overflow = '';
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-bg-card p-0 text-text-primary shadow-2xl backdrop:bg-overlay backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="p-6" noValidate>
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${uid}-title`} className="font-display text-xl font-semibold">
            Sign in with your CBT key
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-body-md text-text-secondary">
          Your CBT key was created with your account. Enter it to go straight to your dashboard.
        </p>

        <label htmlFor={inputId} className="mt-5 block text-sm font-medium">
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
          className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-bg-secondary px-3 font-mono tracking-wider text-text-primary placeholder:text-text-tertiary"
        />
        <p id={hintId} className="mt-1.5 text-sm text-text-secondary">
          Looks like CBT-XXXXXX.
        </p>
        <p id={errorId} role="alert" className="mt-2 min-h-5 text-sm text-error">
          {error}
        </p>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionLink onClick={onClose}>Cancel</ActionLink>
          <ActionLink variant="primary" type="submit" disabled={busy}>
            {busy ? 'Checking key…' : 'Sign in'}
          </ActionLink>
        </div>
      </form>
    </dialog>
  );
}
