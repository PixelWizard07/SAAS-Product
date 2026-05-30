import { useState, useMemo } from 'react'
import { Search, Download, RefreshCw, AlertCircle, Printer, CheckCircle, XCircle, Truck, Tag, RotateCcw, ChevronDown } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { format, differenceInDays } from 'date-fns'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { useOrders } from '../../hooks/useOrders'
import { useAccounts } from '../../hooks/useAccounts'
import { useGenerateLabel } from '../../hooks/useLabels'

const TABS = [
  { key: 'new', label: 'New Orders', color: 'indigo' },
  { key: 'ready', label: 'Ready to Ship', color: 'green' },
  { key: 'shipped', label: 'Shipped', color: 'blue' },
  { key: 'delivered', label: 'Delivered', color: 'slate' },
  { key: 'cancelled', label: 'Cancelled', color: 'slate' },
  { key: 'failed', label: 'Failed Orders', color: 'red' },
]

function filterByTab(orders, tab) {
  switch (tab) {
    case 'new': return orders.filter(o => (o.status === 'Pending' || o.status === 'Confirmed') && (!o.labelStatus || o.labelStatus === 'none'))
    case 'ready': return orders.filter(o => o.labelStatus === 'generated')
    case 'shipped': return orders.filter(o => o.status === 'Shipped')
    case 'delivered': return orders.filter(o => o.status === 'Delivered')
    case 'cancelled': return orders.filter(o => o.status === 'Cancelled')
    case 'failed': return orders.filter(o => o.labelStatus === 'failed')
    default: return orders
  }
}

function isOverdue(order) {
  if (!order.shipByDate && !order.orderDate) return false
  const refDate = order.shipByDate ? new Date(order.shipByDate) : new Date(new Date(order.orderDate).getTime() + 2 * 86400000)
  return differenceInDays(new Date(), refDate) >= 0
}

export default function OrdersPage() {
  const [tab, setTab] = useState('new')
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])

  const { accounts } = useAccounts()
  const { data: allOrders = [], isLoading, refetch } = useOrders({ accountId, search })
  const generateLabel = useGenerateLabel()

  const tabOrders = useMemo(() => {
    let orders = filterByTab(allOrders, tab)
    if (paymentFilter !== 'all') orders = orders.filter(o => o.paymentMode === paymentFilter)
    return orders
  }, [allOrders, tab, paymentFilter])

  const tabCounts = useMemo(() => ({
    new: filterByTab(allOrders, 'new').length,
    ready: filterByTab(allOrders, 'ready').length,
    shipped: filterByTab(allOrders, 'shipped').length,
    delivered: filterByTab(allOrders, 'delivered').length,
    cancelled: filterByTab(allOrders, 'cancelled').length,
    failed: filterByTab(allOrders, 'failed').length,
  }), [allOrders])

  const overdueOrders = useMemo(() =>
    filterByTab(allOrders, 'new').filter(isOverdue),
    [allOrders]
  )

  const toggleRow = (id) => setSelectedRows(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )
  const toggleAll = () =>
    setSelectedRows(selectedRows.length === tabOrders.length ? [] : tabOrders.map(o => o._id))

  const handleGenerateLabel = async (orderId) => {
    try {
      await generateLabel.mutateAsync(orderId)
      toast.success('Label generated successfully')
    } catch {
      toast.error('Failed to generate label')
    }
  }

  const printLabel = (order) => {
    toast.success('Opening label for printing…')
  }

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(tabOrders.map(o => ({
      'Order ID': o.orderId,
      'Product': o.productName,
      'Buyer': o.buyerName,
      'Status': o.status,
      'Payment': o.paymentMode,
      'Price': o.price,
      'Account': o.accountId?.nickname || o.accountId,
      'Order Date': o.orderDate ? format(new Date(o.orderDate), 'dd MMM yyyy') : '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, `meeshohub-orders-${tab}.xlsx`)
    toast.success('Exported to Excel')
  }

  const renderActions = (order) => {
    switch (tab) {
      case 'new':
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); handleGenerateLabel(order._id) }}
              disabled={generateLabel.isPending}
              className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <CheckCircle size={12} /> Accept
            </button>
            <button
              onClick={e => { e.stopPropagation(); toast.success('Order rejected') }}
              className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )
      case 'ready':
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); printLabel(order) }}
              className="px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Printer size={12} /> Print Label
            </button>
            <button
              onClick={e => { e.stopPropagation(); toast.success('Marked as shipped') }}
              className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Truck size={12} /> Mark Shipped
            </button>
          </div>
        )
      case 'shipped':
        return (
          <button
            onClick={e => { e.stopPropagation(); toast('Tracking not available in demo') }}
            className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
          >
            <Truck size={12} /> Track
          </button>
        )
      case 'failed':
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); handleGenerateLabel(order._id) }}
              className="px-2.5 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <RotateCcw size={12} /> Retry Label
            </button>
            <button
              onClick={e => { e.stopPropagation(); toast.success('Printing anyway…') }}
              className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Printer size={12} /> Print Anyway
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm">{allOrders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-600"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={exportXLSX}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-600"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Ship-by alert banner on New Orders */}
      {tab === 'new' && overdueOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">
            <strong>{overdueOrders.length} orders</strong> are overdue and must be shipped immediately
          </span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedRows([]) }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, product or buyer…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Payments</option>
          <option value="Prepaid">Prepaid</option>
          <option value="COD">COD</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading orders…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === tabOrders.length && tabOrders.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  {['Product', 'Order ID', 'Buyer', 'Date', 'Payment', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tabOrders.map(order => {
                  const overdue = tab === 'new' && isOverdue(order)
                  return (
                    <tr
                      key={order._id}
                      onClick={() => setSelected(order)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${overdue ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(order._id)}
                          onChange={() => toggleRow(order._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={order.productImage} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900 line-clamp-1">{order.productName}</p>
                            <p className="text-xs text-slate-400">{order.variant}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 font-mono text-xs">{order.orderId}</p>
                        <p className="text-slate-400 text-xs">{order.accountId?.nickname || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.buyerName}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-500 text-xs">{order.orderDate ? format(new Date(order.orderDate), 'dd MMM') : '—'}</p>
                        {overdue && (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">OVERDUE</span>
                        )}
                        {tab === 'new' && order.shipByDate && !overdue && (
                          <p className="text-xs text-orange-500 mt-0.5">Ship by {format(new Date(order.shipByDate), 'dd MMM')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${order.paymentMode === 'COD' ? 'text-orange-600' : 'text-green-600'}`}>
                          {order.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{order.price}</td>
                      <td className="px-4 py-3"><Badge label={order.status} /></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {renderActions(order)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {tabOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                {accounts.some(a => a.lastSyncAt)
                  ? `No ${TABS.find(t => t.key === tab)?.label.toLowerCase()} found`
                  : 'Sync an account to load orders'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>
          <div className="w-px h-4 bg-slate-600" />
          {tab === 'new' && (
            <>
              <button
                onClick={() => { toast.success(`${selectedRows.length} orders accepted`); setSelectedRows([]) }}
                className="text-sm font-medium text-green-400 hover:text-green-300"
              >
                Accept All
              </button>
              <button
                onClick={async () => {
                  try {
                    for (const id of selectedRows) await generateLabel.mutateAsync(id)
                    toast.success(`Labels generated for ${selectedRows.length} orders`)
                    setSelectedRows([])
                  } catch {
                    toast.error('Some labels failed')
                  }
                }}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Tag size={14} /> Generate Labels
              </button>
            </>
          )}
          {tab === 'ready' && (
            <button
              onClick={() => { toast.success(`${selectedRows.length} labels printed`); setSelectedRows([]) }}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Printer size={14} /> Print All Labels
            </button>
          )}
          <button onClick={() => setSelectedRows([])} className="text-slate-400 hover:text-white ml-2">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <img src={selected.productImage} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-100" />
              <div>
                <h3 className="font-semibold text-slate-900">{selected.productName}</h3>
                <p className="text-sm text-slate-500">{selected.sku} · {selected.variant}</p>
                <Badge label={selected.status} className="mt-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Order ID', selected.orderId],
                ['Account', selected.accountId?.nickname || '—'],
                ['Buyer', selected.buyerName],
                ['Address', selected.buyerAddress],
                ['Payment', selected.paymentMode],
                ['Price', `₹${selected.price}`],
                ['Label Status', selected.labelStatus || 'none'],
                ['Order Date', selected.orderDate ? format(new Date(selected.orderDate), 'dd MMM yyyy') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="font-medium text-slate-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { handleGenerateLabel(selected._id); setSelected(null) }}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium"
              >
                <Tag size={15} /> Generate Label
              </button>
              <button
                onClick={() => { toast.success('Marked as packed'); setSelected(null) }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                Mark as Packed
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
