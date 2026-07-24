import React, { useState } from 'react';
import { Shield, Key, Copy, Check, QrCode } from 'lucide-react';
import { Button, Card, Modal, useToast } from '../components';

interface SecuritySettingsProps {
  token: string;
  mfaEnabled: boolean;
  onUpdate: () => void;
}

export function SecuritySettings({ token, mfaEnabled, onUpdate }: SecuritySettingsProps) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  
  // Setup states
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleEnableStart = async () => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const res = await fetch(`${apiBase}/auth/mfa/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate MFA secret');
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableConfirm = async () => {
    if (!otp || otp.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setIsLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const res = await fetch(`${apiBase}/auth/mfa/enable`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to enable MFA');
      
      addToast({ type: 'success', title: 'Success', message: 'Two-Factor Authentication successfully enabled!' });
      setIsOpen(false);
      setOtp('');
      onUpdate();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableConfirm = async () => {
    if (!otp || otp.length !== 6) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setIsLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const res = await fetch(`${apiBase}/auth/mfa/disable`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disable MFA');
      
      addToast({ type: 'success', title: 'Success', message: 'Two-Factor Authentication disabled.' });
      setIsDisabling(false);
      setOtp('');
      onUpdate();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-1 border border-border bg-bg-secondary p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="space-y-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary border border-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Two-Factor Authentication (2FA)</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Secure your account with an Authenticator App.</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mfaEnabled ? 'bg-success/10 text-success border border-success/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        <div className="pt-2">
          {mfaEnabled ? (
            <Button variant="secondary" size="sm" onClick={() => setIsDisabling(true)} fullWidth>
              Disable 2FA
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={handleEnableStart} fullWidth disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Set Up 2FA Now'}
            </Button>
          )}
        </div>
      </div>

      {/* Enable MFA Modal */}
      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setOtp(''); }} title="Set Up Two-Factor Authentication" maxWidth="md">
        <div className="space-y-6">
          <div className="text-sm text-text-secondary">
            1. Install an authenticator app like Google Authenticator or Authy on your mobile device.<br/>
            2. Scan the QR code below or enter the secret key manually.
          </div>
          
          {qrCode ? (
            <div className="flex flex-col items-center justify-center space-y-4 bg-bg-secondary p-4 rounded-xl border border-border">
              <div className="bg-white p-2 rounded-lg">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center w-full">
                <p className="text-[10px] font-bold uppercase text-text-muted mb-1">Manual Secret Key</p>
                <div className="bg-bg-primary font-mono text-xs p-2 rounded border border-border text-primary font-bold tracking-widest break-all">
                  {secret}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-text-muted text-sm">Generating QR code...</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-text-secondary">3. Verify with 6-digit code</label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-mono text-xl tracking-[0.5em]"
            />
          </div>

          <Button onClick={handleEnableConfirm} fullWidth disabled={isLoading || otp.length !== 6}>
            {isLoading ? 'Verifying...' : 'Verify and Enable'}
          </Button>
        </div>
      </Modal>

      {/* Disable MFA Modal */}
      <Modal isOpen={isDisabling} onClose={() => { setIsDisabling(false); setOtp(''); }} title="Disable Two-Factor Authentication" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Enter the 6-digit code from your authenticator app to disable 2FA. Your account will be less secure.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-mono text-xl tracking-[0.5em]"
            />
          </div>
          <Button variant="secondary" onClick={handleDisableConfirm} fullWidth disabled={isLoading || otp.length !== 6}>
            {isLoading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
