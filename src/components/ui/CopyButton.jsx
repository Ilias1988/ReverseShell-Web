import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/encoding';

/**
 * Reusable copy-to-clipboard button with animated feedback
 */
export default function CopyButton({ text, label = 'Copy', className = '', onCopy }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!text) return;
    
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      onCopy?.();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      aria-label={copied ? 'Copied to clipboard' : label}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg
        text-sm font-medium transition-all duration-200
        ${copied
          ? 'bg-green-600/20 text-green-400 border border-green-500/30'
          : 'bg-shell-blue/10 text-shell-blue border border-shell-blue/30 hover:bg-shell-blue/20 hover:border-shell-blue/50'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95
        ${className}
      `}
    >
      {copied ? (
        <>
          <Check size={16} className="animate-fade-in" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={16} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
