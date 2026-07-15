import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 5000,
    onClose,
}) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    const styles = {
        success: {
            bg: 'bg-emerald-950/90',
            border: 'border-emerald-800',
            icon: 'text-emerald-400',
            iconBg: 'bg-emerald-900/30',
            title: 'text-emerald-300',
        },
        error: {
            bg: 'bg-red-950/90',
            border: 'border-red-800',
            icon: 'text-red-400',
            iconBg: 'bg-red-900/30',
            title: 'text-red-300',
        },
        warning: {
            bg: 'bg-amber-950/90',
            border: 'border-amber-800',
            icon: 'text-amber-400',
            iconBg: 'bg-amber-900/30',
            title: 'text-amber-300',
        },
        info: {
            bg: 'bg-blue-950/90',
            border: 'border-blue-800',
            icon: 'text-blue-400',
            iconBg: 'bg-blue-900/30',
            title: 'text-blue-300',
        },
    };

    const Icons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info,
    };

    const style = styles[type];
    const IconComponent = Icons[type];

    return (
        <div
            className={`${style.bg} ${style.border} border backdrop-blur-xl rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 max-w-md w-full`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className={`${style.iconBg} rounded-lg p-2 flex-shrink-0`}>
                    <IconComponent className={`h-5 w-5 ${style.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold ${style.title}`}>
                        {title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 ml-2 text-slate-400 hover:text-white transition-colors p-1"
                    aria-label="Close notification"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
