import { Heart, Info } from 'lucide-react';

/**
 * App footer with status message and credits
 */
export default function Footer({ statusMessage }) {
  return (
    <footer className="flex items-center justify-between px-6 py-3 border-t border-dark-700/50">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-dark-400">
        <Info size={14} className="shrink-0" />
        <span className="truncate max-w-md">{statusMessage}</span>
      </div>

      {/* Credits */}
      <div className="flex items-center gap-1.5 text-sm text-dark-400">
        <span className="hidden sm:inline">Made with</span>
        <Heart size={14} className="text-red-400 fill-red-400" />
        <span className="hidden sm:inline">for penetration testers</span>
      </div>
    </footer>
  );
}
