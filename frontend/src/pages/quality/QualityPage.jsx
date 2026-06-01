import { useState } from 'react'
import { Star, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'

const MOCK_ISSUES = [
  { orderId: 'MH-2024-003', product: 'Decorative Lamp', issue: 'Product arrived damaged', reported: '28 May 2026', status: 'Open' },
  { orderId: 'MH-2024-005', product: 'Smart Watch', issue: 'Screen flickering', reported: '25 May 2026', status: 'Resolved' },
  { orderId: 'MH-2024-001', product: 'Floral Kurti Set', issue: 'Color mismatch from photos', reported: '22 May 2026', status: 'Open' },
]

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={16} className={i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

function RatingBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 text-right text-slate-500">{label}</span>
      <Star size={12} className="text-amber-400 fill-amber-400" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-slate-500 text-right">{count}</span>
    </div>
  )
}

export default function QualityPage() {
  const ratings = { 5: 820, 4: 380, 3: 140, 2: 55, 1: 28 }
  const total = Object.values(ratings).reduce((a, b) => a + b, 0)
  const avg = Object.entries(ratings).reduce((s, [k, v]) => s + Number(k) * v, 0) / total

  const metrics = [
    { label: 'Returns Due to Quality', value: '3.2%', threshold: 5, ok: true },
    { label: 'Buyer Complaints', value: '1.8%', threshold: 3, ok: true },
    { label: 'Damaged on Delivery', value: '0.9%', threshold: 2, ok: true },
    { label: 'Wrong Product Rate', value: '0.4%', threshold: 1, ok: true },
  ]

  const suggestions = [
    { text: 'Use transparent packaging for electronics', status: 'Action Required' },
    { text: 'Add size chart for all apparel products', status: 'Recommended' },
    { text: 'Include product manual in electronics box', status: 'Completed' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Quality</h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitor product quality and buyer feedback</p>
      </div>

      {/* Overall Score */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{avg.toFixed(1)}</div>
            <StarRating value={avg} />
            <p className="text-sm text-slate-500 mt-2">Based on {total.toLocaleString()} reviews</p>
          </div>
          <div className="flex-1 min-w-48 space-y-2">
            <RatingBar label="5" count={ratings[5]} total={total} color="bg-green-400" />
            <RatingBar label="4" count={ratings[4]} total={total} color="bg-lime-400" />
            <RatingBar label="3" count={ratings[3]} total={total} color="bg-amber-400" />
            <RatingBar label="2" count={ratings[2]} total={total} color="bg-orange-400" />
            <RatingBar label="1" count={ratings[1]} total={total} color="bg-red-400" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Metrics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Quality Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(m => (
              <div key={m.label} className={`p-4 rounded-xl ${m.ok ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {m.ok ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                  <span className={`text-xs font-medium ${m.ok ? 'text-green-700' : 'text-red-700'}`}>
                    {m.ok ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${m.ok ? 'text-green-700' : 'text-red-700'}`}>{m.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                <div className="text-xs text-slate-400">Threshold: {m.threshold}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Improvement Suggestions</h2>
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const color = s.status === 'Action Required' ? 'bg-red-100 text-red-700' : s.status === 'Recommended' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 text-sm text-slate-700">{s.text}</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>{s.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Quality Issues</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Order ID', 'Product', 'Issue', 'Reported', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_ISSUES.map(issue => (
              <tr key={issue.orderId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{issue.orderId}</td>
                <td className="px-4 py-3 text-slate-800">{issue.product}</td>
                <td className="px-4 py-3 text-slate-600">{issue.issue}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{issue.reported}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${issue.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-indigo-600 hover:underline font-medium">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
