import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash2,
  Cpu,
  Radio,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import {
  getAdvisorCapabilityOptions,
  rankPayloads,
} from './advisorEngine'

const STATUS_STYLES = {
  compatible: {
    icon: CheckCircle2,
    label: 'Capability match',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Check requirements',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  unavailable: {
    icon: CircleSlash2,
    label: 'Unavailable',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
  },
}

const VERIFICATION_STYLES = {
  verified: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  conditional: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  experimental: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  deprecated: 'border-red-500/30 bg-red-500/10 text-red-300',
}

export default function PayloadAdvisor({ catalog, os, mode, onApply, onClose }) {
  const closeButtonRef = useRef(null)
  const dialogRef = useRef(null)
  const [transport, setTransport] = useState('any')
  const [category, setCategory] = useState('Any')
  const [maturity, setMaturity] = useState('recommended')
  const [capabilities, setCapabilities] = useState([])
  const [showUnavailable, setShowUnavailable] = useState(false)

  const capabilityOptions = useMemo(
    () => getAdvisorCapabilityOptions(os, catalog),
    [catalog, os],
  )
  const categories = useMemo(
    () => ['Any', ...new Set(catalog.map(payload => payload.category))],
    [catalog],
  )
  const recommendations = useMemo(
    () => rankPayloads(catalog, { transport, category, capabilities, maturity }),
    [catalog, transport, category, capabilities, maturity],
  )
  const unavailableCount = recommendations.filter(
    recommendation => recommendation.status === 'unavailable',
  ).length
  const visibleRecommendations = showUnavailable
    ? recommendations
    : recommendations.filter(recommendation => recommendation.status !== 'unavailable')

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousBodyOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  const toggleCapability = (capability) => {
    setCapabilities(current => current.includes(capability)
      ? current.filter(value => value !== capability)
      : [...current, capability])
  }

  const resetFilters = () => {
    setTransport('any')
    setCategory('Any')
    setMaturity('recommended')
    setCapabilities([])
    setShowUnavailable(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-950/85 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payload-advisor-title"
        data-testid="payload-advisor-dialog"
        className="panel flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border-shell-blue/30 shadow-2xl shadow-shell-blue/10"
      >
        <header className="flex items-start justify-between gap-4 border-b border-dark-700 p-4 sm:p-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-shell-blue">
              <Sparkles size={20} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Guided selection</span>
            </div>
            <h2 id="payload-advisor-title" className="text-xl font-bold text-white">
              Smart Payload Advisor
            </h2>
            <p className="mt-1 text-sm text-dark-300">
              Ranking {os} {mode} payloads using transport and known target capabilities.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-dark-600 bg-dark-900 p-2 text-dark-300 transition hover:border-dark-500 hover:text-white"
            aria-label="Close Smart Payload Advisor"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-b border-dark-700 p-4 lg:border-b-0 lg:border-r sm:p-5">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Radio size={16} className="text-cyan-400" />
                Transport
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['any', 'tcp', 'udp'].map(option => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setTransport(option)}
                    aria-pressed={transport === option}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition ${
                      transport === option
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                        : 'border-dark-600 bg-dark-900 text-dark-300 hover:border-dark-500'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="advisor-category" className="mb-2 block text-sm font-semibold text-gray-200">
                Payload family
              </label>
              <select
                id="advisor-category"
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="input-field"
              >
                {categories.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="advisor-maturity" className="mb-2 block text-sm font-semibold text-gray-200">
                Catalog confidence
              </label>
              <select
                id="advisor-maturity"
                value={maturity}
                onChange={event => setMaturity(event.target.value)}
                className="input-field"
              >
                <option value="recommended">Recommended (hide experimental)</option>
                <option value="verified">Runtime verified only</option>
                <option value="all">Include experimental</option>
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Cpu size={16} className="text-purple-400" />
                Available on target
              </div>
              <p className="mb-3 text-xs leading-relaxed text-dark-400">
                Select only tools you know are installed. Once selected, unselected tools are treated as unavailable.
                Leave everything empty when capabilities are unknown.
              </p>
              <div className="flex flex-wrap gap-2">
                {capabilityOptions.map(option => (
                  <button
                    type="button"
                    key={option.id}
                    data-advisor-capability={option.id}
                    onClick={() => toggleCapability(option.id)}
                    aria-pressed={capabilities.includes(option.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      capabilities.includes(option.id)
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-dark-600 bg-dark-900 text-dark-300 hover:border-dark-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 flex items-center gap-2 text-xs font-medium text-dark-300 transition hover:text-white"
            >
              <RotateCcw size={14} />
              Reset advisor filters
            </button>
          </aside>

          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">Recommendations</h3>
                <p className="text-xs text-dark-400">
                  {visibleRecommendations.length} usable or reviewable payloads, ordered by declared requirements.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {capabilities.length === 0 && (
                <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                  Requirements unconfirmed
                </span>
                )}
                {capabilities.length > 0 && unavailableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUnavailable(current => !current)}
                    aria-pressed={showUnavailable}
                    className="rounded-md border border-dark-600 bg-dark-900 px-2 py-1 text-[11px] text-dark-300 transition hover:border-dark-500 hover:text-white"
                  >
                    {showUnavailable ? 'Hide' : 'Show'} unavailable ({unavailableCount})
                  </button>
                )}
              </div>
            </div>

            {visibleRecommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-dark-600 p-8 text-center">
                <p className="font-medium text-gray-200">No usable payload matches this capability profile.</p>
                {unavailableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUnavailable(true)}
                    className="mt-3 block w-full text-sm text-amber-300 hover:underline"
                  >
                    Review {unavailableCount} unavailable payloads
                  </button>
                )}
                <button type="button" onClick={resetFilters} className="mt-3 text-sm text-shell-blue hover:underline">
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRecommendations.slice(0, 12).map((recommendation) => {
                  const statusStyle = STATUS_STYLES[recommendation.status]
                  const StatusIcon = statusStyle.icon
                  return (
                    <article
                      key={recommendation.payload.id}
                      data-advisor-result
                      className="rounded-xl border border-dark-600 bg-dark-900/70 p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-white">{recommendation.payload.name}</h4>
                            <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle.className}`}>
                              <StatusIcon size={11} />
                              {statusStyle.label}
                            </span>
                            <span className="rounded-md border border-dark-600 px-2 py-0.5 text-[10px] uppercase text-dark-300">
                              {recommendation.payload.transport}
                            </span>
                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${VERIFICATION_STYLES[recommendation.payload.verification.status]}`}>
                              {recommendation.payload.verification.status}
                            </span>
                          </div>
                          <p className="text-sm text-dark-200">{recommendation.reasons[0]}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {recommendation.payload.requiredBinaries.map(requirement => (
                              <span key={requirement} className="rounded bg-dark-800 px-2 py-1 font-mono text-[10px] text-cyan-300">
                                {requirement}
                              </span>
                            ))}
                          </div>
                          {recommendation.cautions.length > 0 && (
                            <p className="mt-2 text-xs leading-relaxed text-amber-300/90">
                              {recommendation.cautions[0]}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          data-advisor-apply
                          onClick={() => onApply(recommendation.payload.name)}
                          disabled={recommendation.status === 'unavailable'}
                          className="shrink-0 rounded-lg border border-shell-blue/40 bg-shell-blue/10 px-3 py-2 text-xs font-semibold text-shell-blue transition hover:bg-shell-blue/20 disabled:cursor-not-allowed disabled:border-dark-600 disabled:bg-dark-800 disabled:text-dark-500"
                        >
                          Use payload
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
