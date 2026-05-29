import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { Download } from 'lucide-react'
import { MOCK_CHART_DATA } from '../../lib/mockData'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const RETURN_REASONS = [
  { name: 'Wrong Product', value: 35 },
  { name: 'Damaged', value: 28 },
  { name: 'Size Mismatch', value: 22 },
  { name: 'Quality Issue', value: 15 },
]
const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444']

const TABS = ['Sales Report', 'Returns Report', 'Payment Summary']

export default function ReportsPage() {
  const [tab, setTab] = useState(0)

  const exportReport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_CHART_DATA)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `meeshohub-report-${TABS[tab].toLowerCase().replace(/ /g, '-')}.xlsx`)
    toast.success('Report exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm">Insights and analytics across all accounts</p>
        </div>
        <button onClick={exportReport} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-700">
          <Download size={15} /> Export Report
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Orders & Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MOCK_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Orders" />
              <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} name="Revenue (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Returns by Reason</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={RETURN_REASONS} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {RETURN_REASONS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Return Counts</h2>
            <div className="space-y-3 mt-6">
              {RETURN_REASONS.map((r, i) => (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{r.name}</span>
                    <span className="font-semibold" style={{ color: COLORS[i] }}>{r.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${r.value}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Daily Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={v => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
