import { useState } from 'react'
import { Gift, Zap, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PROGRAMS = [
  { id: 'bharat', icon: '🇮🇳', name: 'Bharat ki Choice', desc: 'Reach tier-2 & tier-3 city buyers with special pricing', badge: 'Popular', badgeColor: 'bg-purple-100 text-purple-700', action: 'Enroll', enrolled: true },
  { id: 'instant', icon: '💰', name: 'Instant Cash', desc: 'Get business loan at just 10% interest rate — apply today', badge: 'Limited Offer', badgeColor: 'bg-green-100 text-green-700', action: 'Apply Now', enrolled: false },
  { id: 'influencer', icon: '📢', name: 'Influencer Marketing', desc: 'Partner with influencers to boost product visibility', badge: 'New', badgeColor: 'bg-blue-100 text-blue-700', action: 'Explore', enrolled: false },
  { id: 'fsms', icon: '🎉', name: 'FSMS Flash Sale', desc: '7th June mega sale — earn up to 2x more orders', badge: 'LIVE', badgeColor: 'bg-red-100 text-red-700', action: 'Opt In', enrolled: false },
]

const MY_PROMOTIONS = [
  { name: 'Bharat ki Choice', status: 'Active', metric: '45 orders this month', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Instant Cash', status: 'Active', metric: '₹50,000 loan disbursed', color: 'bg-green-50 border-green-200 text-green-700' },
]

export default function PromotionsPage() {
  const [programs, setPrograms] = useState(PROGRAMS)
  const [hours, setHours] = useState(9)

  const toggle = (id) => {
    setPrograms(p => p.map(pr => pr.id === id ? { ...pr, enrolled: !pr.enrolled } : pr))
    toast.success('Promotion updated!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Promotions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Boost your sales with Meesho promotions</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1">
          <Clock size={13} className="text-red-500" />
          <span className="text-xs font-semibold text-red-700">{hours}h left for FSMS</span>
        </div>
      </div>

      {/* FSMS Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-xl p-5 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-lg">FSMS Sale — 7th June</span>
          </div>
          <p className="text-sm text-pink-100">Boost your sales with special pricing and get up to 2x more orders</p>
        </div>
        <button onClick={() => toast.success('Opted in to FSMS!')} className="bg-white text-red-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-red-50">
          Opt In Now →
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Programs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Available Programs</h2>
          {programs.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
              <div className="text-2xl">{p.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                </div>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
              <button
                onClick={() => toggle(p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  p.enrolled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {p.enrolled ? '✓ Enrolled' : p.action}
              </button>
            </div>
          ))}
        </div>

        {/* My Active Promotions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">My Active Promotions</h2>
          {MY_PROMOTIONS.map(p => (
            <div key={p.name} className={`border rounded-xl p-4 ${p.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span className="font-semibold text-sm">{p.name}</span>
                </div>
                <span className="text-xs font-medium bg-white/60 px-2 py-0.5 rounded-full">{p.status}</span>
              </div>
              <p className="text-sm mt-1.5">{p.metric}</p>
            </div>
          ))}
          {MY_PROMOTIONS.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No active promotions yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
