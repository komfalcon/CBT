import React, { useState, useCallback, createContext, useContext } from 'react';
import { Toast } from './Toast';

interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { ...message, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            type={toast.type}
                            title={toast.title}
                            message={toast.message}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
