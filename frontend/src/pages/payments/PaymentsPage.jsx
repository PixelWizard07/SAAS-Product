import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { usePayments } from '../../hooks/usePayments'
import { useAccounts } from '../../hooks/useAccounts'

export default function PaymentsPage() {
  const [accountId, setAccountId] = useState('all')

  const { accounts } = useAccounts()
  const { data: payments = [], isLoading } = usePayments({ accountId })

  // For the chart, get per-account data using all payments
  const { data: allPayments = [] } = usePayments({ accountId: 'all' })

  const summary = useMemo(() => {
    const credit = payments.filter(p => p.type === 'credit').reduce((s, p) => s + p.amount, 0)
    const debit = payments.filter(p => p.type === 'debit').reduce((s, p) => s + p.amount, 0)
    return { credit, debit, balance: credit - debit }
  }, [payments])

  const chartData = useMemo(() => accounts.map(a => ({
    name: a.nickname,
    credit: allPayments.filter(p => {
      const aid = p.accountId?._id || p.accountId
      return String(aid) === String(a._id) && p.type === 'credit'
    }).reduce((s, p) => s + p.amount, 0),
    debit: allPayments.filter(p => {
      const aid = p.accountId?._id || p.accountId
      return String(aid) === String(a._id) && p.type === 'debit'
    }).reduce((s, p) => s + p.amount, 0),
  })), [accounts, allPayments])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Payments</h1>
          <p className="text-slate-500 text-sm">Settlement history and balance overview</p>
        </div>
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="all">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Credits', value: summary.credit, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Debits', value: summary.debit, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Net Balance', value: summary.balance, color: summary.balance >= 0 ? 'text-green-600' : 'text-red-500', bg: 'bg-slate-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-5`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>₹{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Credit vs Debit by Account</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={v => `₹${v.toLocaleString()}`} />
              <Bar dataKey="credit" fill="#22C55E" radius={[4, 4, 0, 0]} name="Credit" />
              <Bar dataKey="debit" fill="#F87171" radius={[4, 4, 0, 0]} name="Debit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <RefreshCw size={18} className="animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {payments.map(p => (
                <div key={p._id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`text-sm font-bold ${p.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>{p.type === 'credit' ? '+' : '−'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.description}</p>
                    <p className="text-xs text-slate-400">{p.date ? format(new Date(p.date), 'dd MMM yyyy') : '—'} · {p.accountId?.nickname || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {p.type === 'credit' ? '+' : '−'}₹{p.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Bal: ₹{p.balance?.toLocaleString() || '—'}</p>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {accounts.some(a => a.lastSyncAt) ? 'No transactions found' : 'Sync an account to see payments'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
