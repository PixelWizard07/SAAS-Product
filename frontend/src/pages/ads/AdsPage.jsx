import { TrendingUp, Eye, MousePointer, DollarSign, Plus } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useState } from 'react'
import toast from 'react-hot-toast'

const MOCK_ADS = [
  { _id: 'ad1', name: 'Kurti Collection Promo', budget: 500, spent: 312, impressions: 45200, clicks: 980, roas: 3.2, status: 'active', account: 'Fashion Store' },
  { _id: 'ad2', name: 'Earbuds Flash Sale', budget: 800, spent: 765, impressions: 89400, clicks: 2100, roas: 4.8, status: 'active', account: 'Electronics Shop' },
  { _id: 'ad3', name: 'Home Decor Week', budget: 300, spent: 120, impressions: 18700, clicks: 430, roas: 2.1, status: 'inactive', account: 'Home Decor' },
  { _id: 'ad4', name: 'Smart Watch Launch', budget: 1000, spent: 1000, impressions: 120000, clicks: 3800, roas: 5.6, status: 'inactive', account: 'Electronics Shop' },
]

export default function AdsPage() {
  const [ads, setAds] = useState(MOCK_ADS)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', budget: '' })

  const handleCreate = (e) => {
    e.preventDefault()
    setAds(a => [...a, { _id: `ad${Date.now()}`, name: form.name, budget: Number(form.budget), spent: 0, impressions: 0, clicks: 0, roas: 0, status: 'active', account: 'Fashion Store' }])
    setShowCreate(false)
    setForm({ name: '', budget: '' })
    toast.success('Campaign created')
  }

  const totalSpent = ads.reduce((s, a) => s + a.spent, 0)
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Advertisements</h1>
          <p className="text-slate-500 text-sm">Campaign performance across all accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Ad Spend', value: `₹${totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Total Impressions', value: `${(totalImpressions/1000).toFixed(1)}K`, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointer, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={18} className={color} /></div>
            <div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        {ads.map(ad => (
          <div key={ad._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{ad.name}</h3>
                  <Badge label={ad.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{ad.account}</p>
              </div>
              <div className="grid grid-cols-4 gap-6 text-center">
                {[
                  ['ROAS', `${ad.roas}x`, ad.roas >= 3 ? 'text-green-600' : 'text-orange-500'],
                  ['Impressions', `${(ad.impressions/1000).toFixed(1)}K`, 'text-slate-900'],
                  ['Clicks', ad.clicks.toLocaleString(), 'text-slate-900'],
                  ['Spend', `₹${ad.spent}`, 'text-slate-900'],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Budget usage</span>
                <span>₹{ad.spent} / ₹{ad.budget}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${ad.spent >= ad.budget ? 'bg-red-400' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(100, (ad.spent / ad.budget) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Ad Campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Summer Sale Promo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Daily Budget (₹)</label>
            <input type="number" required min="50" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="500" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
