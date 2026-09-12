import React, { useEffect, useState } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Automatically show our modal if it's installable
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsOpen(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Install Aurikrex Exam Arena" maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MonitorSmartphone className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-text-primary">Get the App</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Install the Aurikrex Exam Arena app on your device for quick access, offline mock exams, and a better full-screen experience.
          </p>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3">
          <Button onClick={handleInstallClick} fullWidth className="gap-2">
            <Download className="h-4 w-4" />
            Install App
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)} fullWidth>
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
