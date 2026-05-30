import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Info, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useReturns } from '../../hooks/useReturns'
import { useAccounts } from '../../hooks/useAccounts'

const TABS = ['Overview', 'Return Tracking', 'Claim Tracking']

const PERIOD_OPTIONS = ['Last 1 Month', 'Last 3 Months', 'Last 6 Months']

const SORT_OPTIONS = ['Most Recent Order', 'Highest Return Rate', 'Most Returns']

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [period, setPeriod] = useState('Last 1 Month')
  const [category, setCategory] = useState('All')
  const [performance, setPerformance] = useState('All')
  const [sort, setSort] = useState('Most Recent Order')
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('all')

  const { accounts } = useAccounts()
  const { data: returns = [], isLoading } = useReturns({ accountId })

  const filteredReturns = returns.filter(r =>
    search === '' ||
    r.productName?.toLowerCase().includes(search.toLowerCase()) ||
    r.orderId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-xl font-semibold text-slate-900">Return/RTO Orders</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-red-600 font-medium border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded">
            <span className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">▶</span>
            </span>
            How it works?
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order ID, SKU or AWB Number"
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-72"
            />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="pt-5 space-y-5">
          {/* Summary Header */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">Summary</span>
                <button
                  onClick={() => setPeriod(p => PERIOD_OPTIONS[(PERIOD_OPTIONS.indexOf(p) + 1) % PERIOD_OPTIONS.length])}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded font-medium"
                >
                  {period} ▾
                </button>
                <span className="text-xs text-slate-400">12 Apr'26 - 09 May'26 ⓘ</span>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
                <TrendingUp size={14} /> View Trend
              </button>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {/* Customer Return Rate */}
              <div className="p-5 border-b border-slate-100">
                <p className="text-sm text-slate-500 mb-2">Customer Return Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">8.08%</span>
                  <span className="flex items-center gap-0.5 text-sm text-green-600 font-medium">
                    <TrendingDown size={13} /> 0.76%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 border-t border-dashed border-slate-200 pt-1.5">
                  115 orders returned out of 1423 delivered
                </p>
              </div>

              {/* Courier Return Rate */}
              <div className="p-5 border-b border-slate-100">
                <p className="text-sm text-slate-500 mb-2">Courier Return (RTO) Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">9.36%</span>
                  <span className="flex items-center gap-0.5 text-sm text-red-500 font-medium">
                    <TrendingUp size={13} /> 1.19%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 border-t border-dashed border-slate-200 pt-1.5">
                  147 RTO orders out of 1570 dispatched
                </p>
              </div>

              {/* Dual Pricing */}
              <div className="p-5">
                <p className="text-sm text-slate-500 mb-3">Dual Pricing - Customer Return Rate</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Wrong/ Defective Return Price</p>
                    <p className="text-xl font-bold text-green-600">3.06%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Meesho Price</p>
                    <p className="text-xl font-bold text-red-500">10.32%</p>
                  </div>
                </div>
              </div>

              {/* RTO Approved Claims */}
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-sm text-slate-500">RTO Approved Claims (Branded Packet)</p>
                  <Info size={13} className="text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900">0.00%</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  We approved 0 out of 0 claims raised by you
                </p>
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Product Performance</span>
                <span className="text-xs text-slate-400">12 Apr'26 - 09 May'26 ⓘ</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filter by:</span>
                <FilterBtn label="Category" />
                <FilterBtn label="Performance" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sort by:</span>
                <button
                  onClick={() => setSort(s => SORT_OPTIONS[(SORT_OPTIONS.indexOf(s) + 1) % SORT_OPTIONS.length])}
                  className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-3 py-1.5 rounded hover:bg-slate-50 min-w-48 justify-between"
                >
                  {sort} <span className="text-slate-400">▾</span>
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_120px_150px_180px_180px] text-xs font-semibold text-slate-500 px-5 py-2.5 border-b border-slate-100 bg-slate-50">
              <span>Product Details</span>
              <span>Orders Delivered</span>
              <span>Customer Return</span>
              <span>Action</span>
              <span className="flex items-center gap-1">What Changed <Info size={12} /></span>
            </div>

            {/* Table Rows */}
            {isLoading ? (
              <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
            ) : filteredReturns.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No returns found</div>
            ) : (
              filteredReturns.map(ret => (
                <ProductReturnRow key={ret._id} ret={ret} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Return Tracking' && (
        <ReturnTrackingTab returns={filteredReturns} accounts={accounts} accountId={accountId} setAccountId={setAccountId} />
      )}

      {activeTab === 'Claim Tracking' && (
        <div className="pt-8 text-center text-slate-400">
          <p className="text-sm">No claims raised yet.</p>
        </div>
      )}
    </div>
  )
}

function FilterBtn({ label }) {
  return (
    <button className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-3 py-1.5 rounded hover:bg-slate-50">
      {label} <span className="text-slate-400">▾</span>
    </button>
  )
}

function ProductReturnRow({ ret }) {
  return (
    <div className="grid grid-cols-[1fr_120px_150px_180px_180px] px-5 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      {/* Product Details */}
      <div className="flex items-start gap-3 pr-4">
        <img
          src={ret.productImage}
          alt=""
          className="w-14 h-14 rounded object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
          onError={e => { e.target.src = 'https://placehold.co/56x56/f1f5f9/94a3b8?text=P' }}
        />
        <div className="min-w-0">
          <p className="text-sm text-indigo-600 hover:underline cursor-pointer font-medium leading-tight line-clamp-2">
            {ret.productName}
          </p>
          <p className="text-xs text-slate-400 mt-1">Product ID: {ret.productId || ret._id}</p>
          <p className="text-xs text-slate-400">Category: {ret.category || 'General'}</p>
          {ret.dualPricing && (
            <span className="inline-block text-[10px] border border-slate-300 text-slate-500 px-1.5 py-0.5 rounded mt-1">
              Dual Pricing Enabled
            </span>
          )}
        </div>
      </div>

      {/* Orders Delivered */}
      <div className="flex items-center">
        <span className="text-sm font-semibold text-slate-900">{ret.ordersDelivered ?? 0}</span>
      </div>

      {/* Customer Return */}
      <div className="flex items-center">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {(ret.customerReturnRate ?? 0).toFixed(2)}%
          </p>
          <p className="text-xs text-slate-400">{ret.returnCount ?? 0} Returns</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center">
        <button
          onClick={() => toast.success('Opening details…')}
          className="text-sm border border-slate-300 hover:bg-slate-50 px-4 py-1.5 rounded font-medium text-slate-700"
        >
          View Details
        </button>
      </div>

      {/* What Changed */}
      <div className="flex items-center">
        {ret.whatChanged ? (
          <div>
            <p className={`text-sm font-semibold ${ret.changeType === 'increase' ? 'text-red-500' : 'text-green-600'}`}>
              {ret.whatChanged}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Returns {ret.changeType === 'increase' ? 'increased' : 'decreased'} compared<br />to the last month
            </p>
          </div>
        ) : (
          <span className="text-sm text-slate-400">N/A</span>
        )}
      </div>
    </div>
  )
}

function ReturnTrackingTab({ returns, accounts, accountId, setAccountId }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const STATUSES = ['All', 'Initiated', 'Pickup Scheduled', 'Picked Up', 'Refunded']

  const filtered = returns.filter(r =>
    statusFilter === 'All' || r.status === statusFilter
  )

  return (
    <div className="pt-5 space-y-4">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 flex gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-white focus:outline-none"
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded text-sm bg-white focus:outline-none"
        >
          <option value="all">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {/* Return Cards */}
      <div className="space-y-3">
        {filtered.map(ret => (
          <div key={ret._id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-4 items-center">
            <img
              src={ret.productImage}
              alt=""
              className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
              onError={e => { e.target.src = 'https://placehold.co/64x64/f1f5f9/94a3b8?text=P' }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-500">{ret.returnId}</span>
                <span className="text-xs text-slate-400">→ Order {ret.orderId}</span>
                <StatusBadge status={ret.status} />
              </div>
              <p className="font-medium text-slate-900 text-sm">{ret.productName}</p>
              <p className="text-sm text-slate-500 mt-0.5">{ret.returnReason}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>{ret.buyerName}</span>
                <span>·</span>
                <span className="text-indigo-600 font-medium">{ret.accountId?.nickname || '—'}</span>
              </div>
            </div>
            {ret.otp && !ret.otpUsed && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-center flex-shrink-0">
                <p className="text-xs text-green-600 font-medium">Return OTP</p>
                <p className="text-2xl font-bold text-green-700 tracking-[0.2em] mt-0.5">{ret.otp}</p>
              </div>
            )}
            <button
              onClick={() => toast.success('Opening return details…')}
              className="text-sm border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded text-slate-700 flex items-center gap-1.5 flex-shrink-0"
            >
              View <ExternalLink size={12} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-lg text-sm">
            No returns found
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    'Initiated': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pickup Scheduled': 'bg-blue-50 text-blue-700 border-blue-200',
    'Picked Up': 'bg-purple-50 text-purple-700 border-purple-200',
    'Refunded': 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  )
}
