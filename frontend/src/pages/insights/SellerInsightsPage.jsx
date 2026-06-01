import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { useAccounts } from '../../hooks/useAccounts'

const CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `${(i % 30) + 1}`,
  orders: Math.floor(20 + Math.random() * 40),
  revenue: Math.floor(8000 + Math.random() * 20000),
}))

const TOP_PRODUCTS = [
  { name: 'Wireless Earbuds Pro', orders: 234, revenue: 123450, returnRate: 2.1 },
  { name: 'Smart Watch Fitness Tracker', orders: 189, revenue: 245211, returnRate: 1.8 },
  { name: 'Floral Kurti Set', orders: 156, revenue: 45234, returnRate: 4.2 },
  { name: 'Palazzo Pants', orders: 134, revenue: 26666, returnRate: 5.1 },
  { name: 'Bluetooth Speaker', orders: 134, revenue: 79866, returnRate: 3.3 },
]

function Trend({ value, positive }) {
  const isGood = positive ? value >= 0 : value <= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
      {isGood ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(value)}%
    </span>
  )
}

export default function SellerInsightsPage() {
  const [period, setPeriod] = useState('Last 30 Days')
  const { accounts } = useAccounts()

  const accountPerf = useMemo(() => accounts.map((a, i) => ({
    name: a.nickname,
    orders: [312, 389, 146][i] || 50,
    revenue: [98450, 245678, 79052][i] || 20000,
    returnRate: [6.2, 3.1, 12.4][i] || 5.0,
  })), [accounts])

  const stats = [
    { label: 'Orders', value: '847', trend: 12, positive: true },
    { label: 'Revenue', value: '₹4,23,180', trend: 8, positive: true },
    { label: 'Return Rate', value: '8.08%', trend: -0.76, positive: false },
    { label: 'Avg Rating', value: '4.2 ★', trend: 0.1, positive: true },
    { label: 'On-time Dispatch', value: '94.2%', trend: 1.2, positive: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Seller Insights</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance overview across all accounts</p>
        </div>
        <button className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 bg-white hover:bg-slate-50">
          {period} <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <Trend value={s.trend} positive={s.positive} />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Sales Trend — Daily Orders</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
            <Line type="monotone" dataKey="orders" stroke="#6366F1" strokeWidth={2} dot={false} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Top Performing Products</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Product', 'Orders', 'Revenue', 'Return %'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {TOP_PRODUCTS.map(p => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800 text-xs">{p.name}</td>
                  <td className="px-4 py-2.5 text-slate-700">{p.orders}</td>
                  <td className="px-4 py-2.5 text-slate-700">₹{p.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${p.returnRate > 5 ? 'text-red-600' : 'text-green-600'}`}>{p.returnRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Account Performance */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Account Performance</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Account', 'Orders', 'Revenue', 'Return Rate'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accountPerf.map(a => (
                <tr key={a.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-700">{a.orders}</td>
                  <td className="px-4 py-2.5 text-slate-700">₹{a.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${a.returnRate > 10 ? 'text-red-600' : a.returnRate > 6 ? 'text-amber-600' : 'text-green-600'}`}>{a.returnRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
