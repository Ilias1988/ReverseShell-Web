import { useState, useRef, useEffect } from 'react';
import {
  Plug, Monitor, Target, Lock, Search, ChevronDown, X,
  TerminalSquare, Tag
} from 'lucide-react';

/**
 * Left panel: Connection settings, OS, Shell, Category filter, Payload dropdown, Encoding
 */
export default function SettingsPanel({
  ip,
  setIp,
  port,
  setPort,
  os,
  handleOsChange,
  shell,
  handleShellChange,
  availableShells,
  selectedPayload,
  handlePayloadChange,
  encoding,
  handleEncodingChange,
  filteredPayloadNames,
  payloadCount,
  searchQuery,
  setSearchQuery,
  category,
  handleCategoryChange,
  availableCategories,
  mode,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [dropdownOpen]);

  const encodingOptions = ['None', 'Base64', 'URL', 'Double URL'];

  return (
    <div className="panel p-5 flex flex-col gap-1 h-full overflow-y-auto">

      {/* ── Connection Settings ─────────────────── */}
      <div className="section-label mb-3">
        <Plug size={18} className="text-shell-blue" />
        Connection Settings
      </div>

      {/* IP Address */}
      <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">
        {mode === 'bind' ? 'Target IP (RHOST)' : 'IP Address (LHOST)'}
      </label>
      <input
        type="text"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="e.g., 10.10.10.10"
        className="input-field mb-3"
        spellCheck={false}
      />

      {/* Port */}
      <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">
        Port (LPORT)
      </label>
      <input
        type="text"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        placeholder="e.g., 4444"
        className="input-field mb-2"
        spellCheck={false}
      />

      <div className="separator" />

      {/* ── Operating System ────────────────────── */}
      <div className="section-label mb-3">
        <Monitor size={18} className="text-shell-cyan" />
        Operating System
      </div>

      <div className="flex gap-2 mb-2">
        {['Linux', 'Windows'].map((option) => (
          <button
            key={option}
            onClick={() => handleOsChange(option)}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium
              transition-all duration-200 border
              ${os === option
                ? 'bg-shell-blue/15 text-shell-blue border-shell-blue/40 shadow-sm shadow-shell-blue/10'
                : 'bg-dark-900 text-dark-400 border-dark-600 hover:border-dark-500 hover:text-gray-300'
              }
            `}
          >
            {option === 'Linux' ? '🐧' : '🪟'} {option}
          </button>
        ))}
      </div>

      <div className="separator" />

      {/* ── Shell Selector ──────────────────────── */}
      <div className="section-label mb-3">
        <TerminalSquare size={18} className="text-teal-400" />
        Shell
      </div>

      <select
        value={shell}
        onChange={(e) => handleShellChange(e.target.value)}
        className="input-field mb-2"
      >
        {availableShells.map((s) => (
          <option key={s.value} value={s.value}>{s.label} ({s.value})</option>
        ))}
      </select>

      <div className="separator" />

      {/* ── Payload Selection ───────────────────── */}
      <div className="section-label mb-3">
        <Target size={18} className="text-shell-green" />
        Payload Selection
        <span className="ml-auto text-xs text-dark-400 font-normal">{payloadCount} total</span>
      </div>

      {/* Category Filter */}
      {availableCategories && availableCategories.length > 2 && (
        <>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={13} className="text-dark-400 shrink-0" />
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`
                    whitespace-nowrap px-2 py-1 rounded-md text-xs font-medium
                    transition-all duration-150 border shrink-0
                    ${category === cat
                      ? 'bg-shell-green/15 text-shell-green border-shell-green/40'
                      : 'bg-dark-900 text-dark-400 border-dark-700 hover:border-dark-500 hover:text-gray-300'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Custom Searchable Dropdown */}
      <div className="relative mb-2" ref={dropdownRef}>
        {/* Dropdown Trigger */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="
            w-full flex items-center justify-between gap-2
            bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5
            text-sm text-gray-100 font-mono
            hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-shell-blue/50
            transition-all duration-200
          "
        >
          <span className="truncate">{selectedPayload || 'Select a payload...'}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-dark-400 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="
            absolute z-50 w-full mt-2
            bg-dark-800 border border-dark-600 rounded-xl
            shadow-2xl shadow-black/50
            animate-fade-in
            overflow-hidden
          ">
            {/* Search Input */}
            <div className="p-2 border-b border-dark-600">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search payloads..."
                  className="
                    w-full bg-dark-900 border border-dark-600 rounded-lg
                    pl-9 pr-8 py-2 text-sm text-gray-100
                    placeholder-dark-400 font-mono
                    focus:outline-none focus:ring-1 focus:ring-shell-blue/50
                  "
                  spellCheck={false}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gray-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Payload List */}
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredPayloadNames.length === 0 ? (
                <div className="px-4 py-3 text-sm text-dark-400 text-center">
                  No payloads found
                </div>
              ) : (
                filteredPayloadNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      handlePayloadChange(name);
                      setDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm font-mono
                      transition-colors duration-100
                      ${name === selectedPayload
                        ? 'bg-shell-blue/15 text-shell-blue'
                        : 'text-gray-300 hover:bg-dark-700 hover:text-gray-100'
                      }
                    `}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>

            {/* Result count */}
            <div className="px-3 py-2 border-t border-dark-600 text-xs text-dark-400 text-center">
              {filteredPayloadNames.length} of {payloadCount} payloads
            </div>
          </div>
        )}
      </div>

      <div className="separator" />

      {/* ── Encoding Options ────────────────────── */}
      <div className="section-label mb-3">
        <Lock size={18} className="text-amber-400" />
        Encoding Options
      </div>

      <div className="grid grid-cols-2 gap-2">
        {encodingOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleEncodingChange(option)}
            className={`
              py-2 px-3 rounded-lg text-xs font-medium
              transition-all duration-200 border
              ${encoding === option
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-dark-900 text-dark-400 border-dark-600 hover:border-dark-500 hover:text-gray-300'
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Spacer to push content up */}
      <div className="flex-grow" />
    </div>
  );
}
