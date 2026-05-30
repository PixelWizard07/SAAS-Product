import { useState, useEffect } from 'react'
import { Settings, RefreshCw, Tag, Globe, Check } from 'lucide-react'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const SYNC_INTERVALS = [5, 10, 15, 30, 60, 120]
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'UTC']
const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '18:00', '21:00']

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const [form, setForm] = useState({
    autoSyncEnabled: true,
    syncIntervalMinutes: 15,
    autoLabelEnabled: false,
    labelGenerationTime: '09:00',
    timezone: 'Asia/Kolkata',
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form)
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading settings…
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Settings size={20} /> Settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure auto-sync and label generation preferences</p>
      </div>

      {/* Auto-Sync Settings */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Auto-Sync Settings</h2>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Toggle: Enable Auto-Sync */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Enable Auto-Sync</p>
              <p className="text-xs text-slate-500 mt-0.5">Automatically sync orders from all active accounts</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, autoSyncEnabled: !f.autoSyncEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.autoSyncEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Sync Interval */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sync Interval</p>
              <p className="text-xs text-slate-500 mt-0.5">How often to check for new orders</p>
            </div>
            <select
              value={form.syncIntervalMinutes}
              onChange={e => setForm(f => ({ ...f, syncIntervalMinutes: Number(e.target.value) }))}
              disabled={!form.autoSyncEnabled}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50"
            >
              {SYNC_INTERVALS.map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Label Generation Settings */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Label Generation Settings</h2>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Toggle: Auto Label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Auto Label Generation</p>
              <p className="text-xs text-slate-500 mt-0.5">Generate labels automatically at a scheduled time</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, autoLabelEnabled: !f.autoLabelEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.autoLabelEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.autoLabelEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Generation Time */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Generate Labels Daily At</p>
              <p className="text-xs text-slate-500 mt-0.5">Time when labels will be auto-generated</p>
            </div>
            <select
              value={form.labelGenerationTime}
              onChange={e => setForm(f => ({ ...f, labelGenerationTime: e.target.value }))}
              disabled={!form.autoLabelEnabled}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50"
            >
              {TIMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                <Globe size={14} /> Timezone
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Used for scheduling all automated tasks</p>
            </div>
            <select
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors"
        >
          {updateSettings.isPending ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
