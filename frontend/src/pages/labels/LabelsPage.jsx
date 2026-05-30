import { useState } from 'react'
import { Tag, RefreshCw, Printer, AlertCircle, Clock, Settings as SettingsIcon } from 'lucide-react'
import { useLabels, useRetryLabel } from '../../hooks/useLabels'
import { useSettings } from '../../hooks/useSettings'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const TABS = [
  { key: 'success', label: 'Generated Labels' },
  { key: 'failed', label: 'Failed Labels' },
  { key: 'schedule', label: 'Schedule' },
]

function printLabel(label) {
  const w = window.open('', '_blank')
  w.document.write(label.labelHtml)
  w.document.close()
  w.print()
}

export default function LabelsPage() {
  const [tab, setTab] = useState('success')

  const { data: successLabels = [], isLoading: loadingSuccess } = useLabels('success')
  const { data: failedLabels = [], isLoading: loadingFailed } = useLabels('failed')
  const { data: settings } = useSettings()
  const retryLabel = useRetryLabel()

  const handleRetry = async (id) => {
    try {
      await retryLabel.mutateAsync(id)
      toast.success('Label regenerated successfully')
    } catch {
      toast.error('Retry failed')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Labels</h1>
        <p className="text-slate-500 text-sm">Manage shipping labels for your orders</p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.key === 'success' && (
                <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {successLabels.length}
                </span>
              )}
              {t.key === 'failed' && failedLabels.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {failedLabels.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Labels Tab */}
      {tab === 'success' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loadingSuccess ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading labels…
            </div>
          ) : successLabels.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Tag size={32} className="mx-auto mb-3 opacity-40" />
              <p>No labels generated yet</p>
              <p className="text-xs mt-1">Go to Orders and generate labels for your shipments</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Order ID', 'Product', 'Account', 'Generated At', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {successLabels.map(label => (
                  <tr key={label._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{label.orderId}</td>
                    <td className="px-4 py-3 text-slate-700">{label.productName || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{label.accountId?.nickname || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {label.generatedAt ? format(new Date(label.generatedAt), 'dd MMM, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => printLabel(label)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        <Printer size={13} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Failed Labels Tab */}
      {tab === 'failed' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loadingFailed ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
            </div>
          ) : failedLabels.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p>No failed labels</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Order ID', 'Account', 'Fail Reason', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {failedLabels.map(label => (
                  <tr key={label._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{label.orderId}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{label.accountId?.nickname || '—'}</td>
                    <td className="px-4 py-3 text-red-600 text-xs">{label.failReason || 'Unknown error'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRetry(label._id)}
                        disabled={retryLabel.isPending}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        <RefreshCw size={13} /> Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Auto Label Generation Schedule</h2>
              <p className="text-sm text-slate-500">Labels are automatically generated daily at a set time</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Auto Label Generation</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${settings?.autoLabelEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                {settings?.autoLabelEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Daily Generation Time</span>
              <span className="text-sm font-semibold text-slate-900">{settings?.labelGenerationTime || '09:00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Timezone</span>
              <span className="text-sm text-slate-700">{settings?.timezone || 'Asia/Kolkata'}</span>
            </div>
          </div>

          <Link
            to="/settings"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            <SettingsIcon size={15} /> Change schedule settings →
          </Link>
        </div>
      )}
    </div>
  )
}
