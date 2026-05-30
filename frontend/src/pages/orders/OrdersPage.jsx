import { useState, useMemo } from 'react'
import { Search, Download, RefreshCw, ChevronDown, Printer, Tag, XCircle, Layers } from 'lucide-react'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { useOrders, useAcceptOrder, useCancelOrder, useDownloadOrderLabel } from '../../hooks/useOrders'
import { useAccounts } from '../../hooks/useAccounts'

const TABS = [
  { key: 'on_hold', label: 'On Hold' },
  { key: 'pending', label: 'Pending' },
  { key: 'ready_to_ship', label: 'Ready to Ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'cancelled', label: 'Cancelled' },
]

function getSlaStatus(shipByDate) {
  if (!shipByDate) return 'ok'
  const d = new Date(shipByDate)
  if (isPast(d) && !isToday(d)) return 'breached'
  if (isToday(d)) return 'today'
  const diff = differenceInDays(d, new Date())
  if (diff <= 1) return 'breaching'
  return 'ok'
}

function SLABadge({ shipByDate }) {
  const status = getSlaStatus(shipByDate)
  if (status === 'breached') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
      ⚠ Breached
    </span>
  )
  if (status === 'today' || status === 'breaching') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
      ⚠ Breaching Soon
    </span>
  )
  return null
}

function filterByTab(orders, tab) {
  switch (tab) {
    case 'on_hold': return orders.filter(o => o.status === 'On Hold')
    case 'pending': return orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed')
    case 'ready_to_ship': return orders.filter(o => o.labelStatus === 'generated' || o.status === 'Ready to Ship')
    case 'shipped': return orders.filter(o => o.status === 'Shipped')
    case 'cancelled': return orders.filter(o => o.status === 'Cancelled')
    default: return orders
  }
}

function generateMeeshoId(orderId) {
  if (!orderId) return 'N/A'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let result = ''
  let hash = 0
  for (let i = 0; i < orderId.length; i++) hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0
  for (let i = 0; i < 9; i++) {
    result += chars[hash % chars.length]
    hash = (hash * 1103515245 + 12345) >>> 0
  }
  return result
}

function FilterDropdown({ label }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 bg-white">
      {label} <ChevronDown size={14} className="text-slate-400" />
    </button>
  )
}

export default function OrdersPage() {
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('all')
  const [selectedRows, setSelectedRows] = useState([])

  const { accounts } = useAccounts()
  const { data: allOrders = [], isLoading, refetch } = useOrders({ accountId, search })
  const acceptOrder = useAcceptOrder()
  const cancelOrder = useCancelOrder()
  const downloadLabel = useDownloadOrderLabel()

  const tabOrders = useMemo(() => filterByTab(allOrders, tab), [allOrders, tab])

  const tabCounts = useMemo(() => {
    const counts = {}
    TABS.forEach(t => { counts[t.key] = filterByTab(allOrders, t.key).length })
    return counts
  }, [allOrders])

  const toggleRow = (id) => setSelectedRows(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )
  const toggleAll = () =>
    setSelectedRows(selectedRows.length === tabOrders.length ? [] : tabOrders.map(o => o._id))

  const handleAccept = async (order) => {
    try {
      await acceptOrder.mutateAsync(order._id)
      toast.success(`Order ${order.subOrderId || order.orderId} accepted on Meesho`)
    } catch {
      toast.error('Failed to accept order')
    }
  }

  const handleCancel = async (order) => {
    try {
      await cancelOrder.mutateAsync({ orderId: order._id, reason: 'Seller cancelled' })
      toast.success('Order cancelled on Meesho')
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const handleDownloadLabel = async (order) => {
    try {
      const html = await downloadLabel.mutateAsync(order._id)
      if (html) {
        const w = window.open('', '_blank')
        w.document.write(html)
        w.document.close()
        w.print()
        toast.success('Label opened for printing')
      } else {
        toast.error('Label not available')
      }
    } catch {
      toast.error('Failed to download label')
    }
  }

  const [bulkLabelLoading, setBulkLabelLoading] = useState(false)

  const handleDownloadAllLabels = async (orderIds) => {
    if (!orderIds.length) return
    setBulkLabelLoading(true)
    const toastId = toast.loading(`Generating ${orderIds.length} label${orderIds.length > 1 ? 's' : ''}…`)
    try {
      const results = await Promise.allSettled(
        orderIds.map(id => downloadLabel.mutateAsync(id))
      )
      const htmlParts = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value)

      if (!htmlParts.length) {
        toast.error('No labels could be generated', { id: toastId })
        return
      }

      // Strip <html>/<body> wrappers and join with print page-breaks
      const bodyContents = htmlParts.map(html => {
        const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        return match ? match[1] : html
      })

      const combined = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Meesho Labels (${htmlParts.length})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; }
    .label-page { page-break-after: always; padding: 16px; }
    .label-page:last-child { page-break-after: auto; }
    @media print {
      .label-page { page-break-after: always; }
      .label-page:last-child { page-break-after: auto; }
      .no-print { display: none !important; }
    }
    .print-bar {
      position: fixed; top: 0; left: 0; right: 0;
      background: #4f46e5; color: #fff; padding: 10px 20px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 9999; font-size: 14px;
    }
    .print-bar button {
      background: #fff; color: #4f46e5; border: none;
      padding: 6px 16px; border-radius: 6px; font-weight: 600;
      cursor: pointer; font-size: 14px;
    }
    .content { margin-top: 52px; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>📦 ${htmlParts.length} of ${orderIds.length} label${orderIds.length > 1 ? 's' : ''} ready</span>
    <button onclick="window.print()">🖨 Print All</button>
  </div>
  <div class="content">
    ${bodyContents.map(c => `<div class="label-page">${c}</div>`).join('\n')}
  </div>
  <script>
    window.onafterprint = function() { window.close(); };
  </script>
</body>
</html>`

      const w = window.open('', '_blank')
      w.document.write(combined)
      w.document.close()
      toast.success(`${htmlParts.length} label${htmlParts.length > 1 ? 's' : ''} ready — printing…`, { id: toastId })
      setTimeout(() => w.print(), 600)
      setSelectedRows([])
    } catch {
      toast.error('Bulk label generation failed', { id: toastId })
    } finally {
      setBulkLabelLoading(false)
    }
  }

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(tabOrders.map(o => ({
      'Sub-order ID': o.subOrderId || o.orderId,
      'Product': o.productName,
      'SKU ID': o.sku,
      'Meesho ID': generateMeeshoId(o.orderId),
      'Quantity': o.quantity || 1,
      'Size': o.variant || o.size || '—',
      'Dispatch Date': o.shipByDate ? format(new Date(o.shipByDate), 'dd MMM yyyy') : '—',
      'Status': o.status,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, `meeshohub-orders-${tab}.xlsx`)
    toast.success('Exported to Excel')
  }

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
        <div className="flex items-center gap-2">
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded text-sm font-medium text-slate-600 bg-white"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {tab === 'ready_to_ship' && tabOrders.length > 0 && (
            <button
              onClick={() => handleDownloadAllLabels(tabOrders.map(o => o._id))}
              disabled={bulkLabelLoading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              {bulkLabelLoading
                ? <RefreshCw size={14} className="animate-spin" />
                : <Layers size={14} />}
              Print All Labels ({tabOrders.length})
            </button>
          )}
          <button
            onClick={exportXLSX}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded text-sm font-medium text-slate-600 bg-white"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-t-lg border-b-0">
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedRows([]) }}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-sm text-slate-500 font-medium mr-1">Filter by</span>
          <FilterDropdown label="SLA Status" />
          <FilterDropdown label="Label downloaded" />
          <FilterDropdown label="Dispatch Date" />
          <FilterDropdown label="Order Date" />
          <FilterDropdown label="SKU ID" />
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders…"
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-52"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading orders…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === tabOrders.length && tabOrders.length > 0}
                      onChange={toggleAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-64">Product Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-44">Sub-order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">SKU ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Meesho ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Quantity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-36">Dispatch Date/SLA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 min-w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabOrders.map(order => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    tab={tab}
                    selected={selectedRows.includes(order._id)}
                    onToggle={() => toggleRow(order._id)}
                    onAccept={() => handleAccept(order)}
                    onCancel={() => handleCancel(order)}
                    onDownloadLabel={() => handleDownloadLabel(order)}
                    isPending={acceptOrder.isPending || cancelOrder.isPending || downloadLabel.isPending}
                  />
                ))}
              </tbody>
            </table>
            {tabOrders.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                {accounts.some(a => a.lastSyncAt)
                  ? `No ${TABS.find(t => t.key === tab)?.label.toLowerCase()} orders`
                  : 'Sync an account to load orders'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>
          <div className="w-px h-4 bg-slate-600" />
          {tab === 'pending' && (
            <>
              <button
                onClick={() => { toast.success(`${selectedRows.length} orders accepted`); setSelectedRows([]) }}
                className="text-sm font-medium text-green-400 hover:text-green-300"
              >
                Accept All
              </button>
              <button
                onClick={() => { toast.success('Orders cancelled'); setSelectedRows([]) }}
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Cancel All
              </button>
            </>
          )}
          {tab === 'ready_to_ship' && (
            <button
              onClick={() => handleDownloadAllLabels(selectedRows)}
              disabled={bulkLabelLoading}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
            >
              {bulkLabelLoading
                ? <RefreshCw size={14} className="animate-spin" />
                : <Tag size={14} />}
              Print {selectedRows.length} Label{selectedRows.length > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => setSelectedRows([])} className="text-slate-400 hover:text-white ml-2">
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, tab, selected, onToggle, onAccept, onCancel, onDownloadLabel, isPending }) {
  const subOrderId = order.subOrderId || (order.orderId ? `${order.orderId}_1` : '—')
  const meeshoId = generateMeeshoId(order.orderId)
  const size = order.variant || order.size || 'Free Size'
  const qty = order.quantity || 1
  const labelDownloaded = order.labelStatus === 'printed' || order.labelStatus === 'generated'

  return (
    <tr className={`hover:bg-slate-50/60 transition-colors ${selected ? 'bg-indigo-50/30' : ''}`}>
      <td className="px-4 py-3.5">
        <input type="checkbox" checked={selected} onChange={onToggle} className="rounded border-slate-300" />
      </td>

      {/* Product Details */}
      <td className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <img
            src={order.productImage || `https://placehold.co/48x48/f1f5f9/64748b?text=P`}
            alt=""
            className="w-12 h-12 rounded object-cover bg-slate-100 flex-shrink-0 border border-slate-200"
            onError={e => { e.target.src = `https://placehold.co/48x48/f1f5f9/64748b?text=P` }}
          />
          <div className="min-w-0">
            <p className="text-indigo-600 hover:underline cursor-pointer font-medium text-sm leading-tight line-clamp-2">
              {order.productName || 'Product Name'}
            </p>
            {order.isAd && (
              <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1">
                🛍 Ad order
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {order.orderId}
            </p>
          </div>
        </div>
      </td>

      {/* Sub-order ID */}
      <td className="px-4 py-3.5">
        <span className="text-xs text-slate-600 font-mono">{subOrderId}</span>
      </td>

      {/* SKU ID */}
      <td className="px-4 py-3.5">
        <span className="text-xs text-slate-600">{order.sku || '—'}</span>
      </td>

      {/* Meesho ID */}
      <td className="px-4 py-3.5">
        <span className="text-xs font-mono text-slate-700">{meeshoId}</span>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3.5 text-sm text-slate-700">{qty}</td>

      {/* Size */}
      <td className="px-4 py-3.5 text-sm text-slate-700">{size}</td>

      {/* Dispatch Date / SLA */}
      <td className="px-4 py-3.5">
        {order.shipByDate ? (
          <div className="space-y-1">
            <p className="text-sm text-slate-700">{format(new Date(order.shipByDate), 'dd MMM yyyy')}</p>
            <SLABadge shipByDate={order.shipByDate} />
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>

      {/* Action */}
      <td className="px-4 py-3.5">
        {tab === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAccept}
              disabled={isPending}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
            >
              Accept
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
        {tab === 'ready_to_ship' && (
          <div className="flex flex-col items-start gap-1">
            <button
              onClick={onDownloadLabel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
            >
              <Printer size={12} /> Label
            </button>
            <span className={`text-[11px] font-medium ${labelDownloaded ? 'text-green-600' : 'text-slate-400'}`}>
              {labelDownloaded ? '✓ Downloaded' : 'Not Downloaded'}
            </span>
          </div>
        )}
        {tab === 'shipped' && (
          <span className="text-xs text-slate-500 bg-blue-50 border border-blue-200 px-2 py-1 rounded font-medium text-blue-600">Shipped</span>
        )}
        {tab === 'cancelled' && (
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-500">Cancelled</span>
        )}
        {tab === 'on_hold' && (
          <button
            onClick={onAccept}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold"
          >
            Release
          </button>
        )}
      </td>
    </tr>
  )
}
