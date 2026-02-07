import { Terminal, Github, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

/**
 * App header with title, GitHub link, and fullscreen toggle
 */
export default function Header() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);

    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-shell-blue/10 border border-shell-blue/20">
          <Terminal size={22} className="text-shell-blue" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-100 tracking-tight">
            Reverse Shell Generator
          </h1>
          <p className="text-xs text-dark-400 font-medium">
            Web Edition — Penetration Testing Toolkit
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/Ilias1988/ReverseShell-Web"
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-2 px-3 py-2 rounded-lg
            text-sm text-dark-400 hover:text-gray-200
            bg-dark-800 border border-dark-600 hover:border-dark-500
            transition-all duration-200
          "
        >
          <Github size={16} />
          <span className="hidden sm:inline">GitHub</span>
        </a>

        <button
          onClick={toggleFullscreen}
          className="
            inline-flex items-center gap-2 px-3 py-2 rounded-lg
            text-sm text-dark-400 hover:text-gray-200
            bg-dark-800 border border-dark-600 hover:border-dark-500
            transition-all duration-200
          "
          title="Toggle Fullscreen (F11)"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span className="hidden sm:inline">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>
      </div>
    </header>
  );
}
