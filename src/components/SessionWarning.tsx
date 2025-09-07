import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SessionWarning = () => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const handleSessionWarning = (event: CustomEvent) => {
            setShowWarning(true);
            toast.error(event.detail.message, {
                duration: 10000,
                position: 'top-center',
            });
        };

        window.addEventListener('session-warning', handleSessionWarning as EventListener);

        return () => {
            window.removeEventListener('session-warning', handleSessionWarning as EventListener);
        };
    }, []);

    if (!showWarning) return null;

    return (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Session Warning
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Your session will expire in 30 minutes. Please save your work.
                    </p>
                </div>
                <button
                    onClick={() => setShowWarning(false)}
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default SessionWarning;
