import { useState, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Crosshair } from 'lucide-react';
import { useRevShell } from './hooks/useRevShell';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SettingsPanel from './components/panels/SettingsPanel';
import OutputPanel from './components/panels/OutputPanel';
import MsfvenomPanel from './components/panels/MsfvenomPanel';
import Toast from './components/ui/Toast';

const MODE_TABS = [
  { id: 'reverse', label: 'Reverse', icon: ArrowDownLeft, color: 'shell-blue' },
  { id: 'bind', label: 'Bind', icon: ArrowUpRight, color: 'orange-400' },
  { id: 'msfvenom', label: 'MSFVenom', icon: Crosshair, color: 'red-400' },
];

/**
 * Main Application Component — v2
 * Supports: Reverse Shell, Bind Shell, MSFVenom tabs
 */
export default function App() {
  const shell = useRevShell();

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '' });
  }, []);

  const isMsfvenom = shell.mode === 'msfvenom';

  return (
    <div className="h-screen flex flex-col bg-dark-950 text-gray-100 overflow-hidden">
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={hideToast}
      />

      {/* Header */}
      <Header />

      {/* ── Mode Tabs ──────────────────────────── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-1 p-1 bg-dark-900/60 border border-dark-700/50 rounded-xl w-fit">
          {MODE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = shell.mode === id;
            const activeStyles = {
              reverse: 'bg-sky-500/15 text-sky-400',
              bind: 'bg-orange-500/15 text-orange-400',
              msfvenom: 'bg-red-500/15 text-red-400',
            };
            return (
              <button
                key={id}
                onClick={() => shell.handleModeChange(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? activeStyles[id]
                    : 'text-dark-400 hover:text-gray-300 hover:bg-dark-800/50'
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 px-5 pb-2 min-h-0 overflow-hidden">
        {isMsfvenom ? (
          /* ════ MSFVenom Mode ════ */
          <MsfvenomPanel
            ip={shell.ip}
            port={shell.port}
            onCopy={(what) => {
              shell.showCopySuccess(what);
              showToast(`${what} copied to clipboard!`);
            }}
          />
        ) : (
          /* ════ Reverse / Bind Mode ════ */
          <>
            {/* Left Panel: Settings */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 min-h-0 overflow-hidden">
              <SettingsPanel
                ip={shell.ip}
                setIp={shell.setIp}
                port={shell.port}
                setPort={shell.setPort}
                os={shell.os}
                handleOsChange={shell.handleOsChange}
                shell={shell.shell}
                handleShellChange={shell.handleShellChange}
                availableShells={shell.availableShells}
                selectedPayload={shell.selectedPayload}
                handlePayloadChange={shell.handlePayloadChange}
                encoding={shell.encoding}
                handleEncodingChange={shell.handleEncodingChange}
                filteredPayloadNames={shell.filteredPayloadNames}
                payloadCount={shell.payloadCount}
                searchQuery={shell.searchQuery}
                setSearchQuery={shell.setSearchQuery}
                category={shell.category}
                handleCategoryChange={shell.handleCategoryChange}
                availableCategories={shell.availableCategories}
                mode={shell.mode}
              />
            </div>

            {/* Right Panel: Output */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <OutputPanel
                listenerCommand={shell.listenerCommand}
                generatedPayload={shell.generatedPayload}
                selectedPayload={shell.selectedPayload}
                encoding={shell.encoding}
                mode={shell.mode}
                shellBinary={shell.shell}
                onCopyListener={() => {
                  shell.showCopySuccess('Listener');
                  showToast('Listener command copied to clipboard!');
                }}
                onCopyPayload={() => {
                  shell.showCopySuccess('Payload');
                  showToast('Payload copied to clipboard!');
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer statusMessage={shell.statusMessage} />
    </div>
  );
}
