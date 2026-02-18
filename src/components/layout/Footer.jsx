import { Heart, Info, Github, Twitter, Linkedin, Globe } from 'lucide-react';

/**
 * App footer with status message, social links, and credits
 */
export default function Footer({ statusMessage }) {
  return (
    <footer className="flex items-center justify-between px-6 py-3 border-t border-dark-700/50">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-dark-400">
        <Info size={14} className="shrink-0" />
        <span className="truncate max-w-md">{statusMessage}</span>
      </div>

      {/* Credits + Social */}
      <div className="flex items-center gap-3">
        {/* Social Links */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://ilias1988.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-400 hover:text-gray-200 transition-colors duration-200"
            title="Website"
          >
            <Globe size={15} />
          </a>
          <a
            href="https://github.com/Ilias1988"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-400 hover:text-gray-200 transition-colors duration-200"
            title="GitHub"
          >
            <Github size={15} />
          </a>
          <a
            href="https://www.linkedin.com/in/ilias-georgopoulos-b491a3371/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-400 hover:text-gray-200 transition-colors duration-200"
            title="LinkedIn"
          >
            <Linkedin size={15} />
          </a>
          <a
            href="https://x.com/EliotGeo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-400 hover:text-gray-200 transition-colors duration-200"
            title="X (Twitter)"
          >
            <Twitter size={15} />
          </a>
        </div>

        {/* Separator */}
        <span className="text-dark-600 hidden sm:inline">|</span>

        {/* Made with love */}
        <div className="flex items-center gap-1.5 text-sm text-dark-400">
          <span className="hidden sm:inline">Made with</span>
          <Heart size={14} className="text-red-400 fill-red-400" />
          <span className="hidden sm:inline">for penetration testers</span>
        </div>
      </div>
    </footer>
  );
}
