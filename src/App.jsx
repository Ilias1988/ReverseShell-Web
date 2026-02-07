import { useState, useCallback } from 'react';
import { useRevShell } from './hooks/useRevShell';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SettingsPanel from './components/panels/SettingsPanel';
import OutputPanel from './components/panels/OutputPanel';
import Toast from './components/ui/Toast';

/**
 * Main Application Component
 * Mirrors the Python RevShellGenerator layout:
 * - Header (title + fullscreen)
 * - Left Panel (settings) | Right Panel (output)
 * - Footer (status + credits)
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 px-5 pb-2 min-h-0 overflow-hidden">
        {/* Left Panel: Settings */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 min-h-0 overflow-hidden">
          <SettingsPanel
            ip={shell.ip}
            setIp={shell.setIp}
            port={shell.port}
            setPort={shell.setPort}
            os={shell.os}
            handleOsChange={shell.handleOsChange}
            selectedPayload={shell.selectedPayload}
            handlePayloadChange={shell.handlePayloadChange}
            encoding={shell.encoding}
            handleEncodingChange={shell.handleEncodingChange}
            filteredPayloadNames={shell.filteredPayloadNames}
            payloadCount={shell.payloadCount}
            searchQuery={shell.searchQuery}
            setSearchQuery={shell.setSearchQuery}
          />
        </div>

        {/* Right Panel: Output */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <OutputPanel
            listenerCommand={shell.listenerCommand}
            generatedPayload={shell.generatedPayload}
            selectedPayload={shell.selectedPayload}
            encoding={shell.encoding}
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
      </main>

      {/* Footer */}
      <Footer statusMessage={shell.statusMessage} />
    </div>
  );
}
