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
            border: 'border-success/30',
            icon: 'text-success',
            iconBg: 'bg-success/15',
            title: 'text-success',
        },
        error: {
            border: 'border-error/30',
            icon: 'text-error',
            iconBg: 'bg-error/15',
            title: 'text-error',
        },
        warning: {
            border: 'border-warning/30',
            icon: 'text-warning',
            iconBg: 'bg-warning/15',
            title: 'text-warning',
        },
        info: {
            border: 'border-info/30',
            icon: 'text-info',
            iconBg: 'bg-info/15',
            title: 'text-info',
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
            className={`bg-bg-card border ${style.border} backdrop-blur-xl rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 max-w-md w-full`}
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
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 ml-2 text-text-muted hover:text-text-primary transition-colors p-1"
                    aria-label="Close notification"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
