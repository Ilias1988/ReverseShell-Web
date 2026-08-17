import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

/**
 * Animated toast notification component
 */
export default function Toast({ message, show, onClose, duration = 2500 }) {
  useEffect(() => {
    if (!show) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-6 right-6 z-50 flex items-center gap-3
        bg-dark-800 border border-green-500/30 rounded-xl
        px-5 py-3 shadow-2xl shadow-green-500/10
        animate-fade-in
      `}
    >
      <CheckCircle size={20} className="text-green-400 shrink-0" />
      <span className="text-sm text-gray-200 font-medium">{message}</span>
      <button
        onClick={() => onClose?.()}
        aria-label="Close notification"
        className="text-dark-400 hover:text-gray-200 transition-colors ml-2"
      >
        <X size={16} />
      </button>
    </div>
  );
}
