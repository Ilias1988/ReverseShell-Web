import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

/**
 * Animated toast notification component
 */
export default function Toast({ message, show, onClose, duration = 2500 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !visible) return null;

  return (
    <div
      className={`
        fixed top-6 right-6 z-50 flex items-center gap-3
        bg-dark-800 border border-green-500/30 rounded-xl
        px-5 py-3 shadow-2xl shadow-green-500/10
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <CheckCircle size={20} className="text-green-400 shrink-0" />
      <span className="text-sm text-gray-200 font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="text-dark-400 hover:text-gray-200 transition-colors ml-2"
      >
        <X size={16} />
      </button>
    </div>
  );
}
