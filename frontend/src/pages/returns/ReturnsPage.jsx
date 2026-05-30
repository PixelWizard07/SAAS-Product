import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { useReturns } from '../../hooks/useReturns'
import { useAccounts } from '../../hooks/useAccounts'

const STATUSES = ['All', 'Initiated', 'Pickup Scheduled', 'Picked Up', 'Refunded']

export default function ReturnsPage() {
  const [status, setStatus] = useState('All')
  const [accountId, setAccountId] = useState('all')

  const { accounts } = useAccounts()
  const { data: returns = [], isLoading } = useReturns({ accountId, status })

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(returns.map(r => ({
      'Return ID': r.returnId, 'Order ID': r.orderId, 'Product': r.productName,
      'Reason': r.returnReason, 'Status': r.status, 'Buyer': r.buyerName,
      'Account': r.accountId?.nickname || r.accountId,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Returns')
    XLSX.writeFile(wb, 'meeshohub-returns.xlsx')
    toast.success('Exported to Excel')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Returns</h1>
          <p className="text-slate-500 text-sm">{returns.length} return requests</p>
        </div>
        <button onClick={exportXLSX} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-700">
          <Download size={15} /> Export Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-3 flex-wrap">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="all">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading returns…
        </div>
      ) : (
        <div className="grid gap-4">
          {returns.map(ret => (
            <div key={ret._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-center">
              <img src={ret.productImage} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">{ret.returnId}</span>
                  <span className="text-xs text-slate-400">→ Order {ret.orderId}</span>
                  <Badge label={ret.status} />
                </div>
                <p className="font-medium text-slate-900">{ret.productName}</p>
                <p className="text-sm text-slate-500 mt-0.5">{ret.returnReason}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{ret.buyerName}</span>
                  <span>·</span>
                  <span className="text-brand-600 font-medium">{ret.accountId?.nickname || '—'}</span>
                </div>
              </div>
              {ret.otp && !ret.otpUsed && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-green-600 font-medium">Return OTP</p>
                  <p className="text-xl font-bold text-green-700 tracking-widest mt-0.5">{ret.otp}</p>
                </div>
              )}
            </div>
          ))}
          {returns.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
              {accounts.some(a => a.lastSyncAt) ? 'No returns found' : 'Sync an account to load returns'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
