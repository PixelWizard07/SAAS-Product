import { useState, useMemo } from 'react'
import { Search, Filter, Download, Printer } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { MOCK_ORDERS, MOCK_ACCOUNTS } from '../../lib/mockData'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [accountId, setAccountId] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => MOCK_ORDERS.filter(o => {
    if (status !== 'All' && o.status !== status) return false
    if (accountId !== 'all' && o.accountId._id !== accountId) return false
    if (search && !o.orderId.toLowerCase().includes(search.toLowerCase()) && !o.productName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [search, status, accountId])

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(o => ({
      'Order ID': o.orderId, 'Product': o.productName, 'SKU': o.sku, 'Variant': o.variant,
      'Buyer': o.buyerName, 'Status': o.status, 'Payment': o.paymentMode, 'Price': o.price,
      'Account': o.accountId.nickname, 'Order Date': format(new Date(o.orderDate), 'dd MMM yyyy'),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'meeshohub-orders.xlsx')
    toast.success('Exported to Excel')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm">{filtered.length} orders found</p>
        </div>
        <button onClick={exportXLSX} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-700">
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or product…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="all">All Accounts</option>
          {MOCK_ACCOUNTS.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Product', 'Order ID', 'Buyer', 'Date', 'Payment', 'Price', 'Status', 'Account'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(order => (
                <tr key={order._id} onClick={() => setSelected(order)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={order.productImage} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{order.productName}</p>
                        <p className="text-xs text-slate-400">{order.variant}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{order.orderId}</td>
                  <td className="px-4 py-3 text-slate-600">{order.buyerName}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(order.orderDate), 'dd MMM')}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${order.paymentMode === 'COD' ? 'text-orange-600' : 'text-green-600'}`}>{order.paymentMode}</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-900">₹{order.price}</td>
                  <td className="px-4 py-3"><Badge label={order.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{order.accountId.nickname}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">No orders match your filters</div>
          )}
        </div>
      </div>

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
                ['Account', selected.accountId.nickname],
                ['Buyer', selected.buyerName],
                ['Address', selected.buyerAddress],
                ['Payment', selected.paymentMode],
                ['Price', `₹${selected.price}`],
                ['Order Date', format(new Date(selected.orderDate), 'dd MMM yyyy')],
                ['Expected Delivery', format(new Date(selected.expectedDelivery), 'dd MMM yyyy')],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="font-medium text-slate-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { toast.success('Label print queued'); setSelected(null) }} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium">
                <Printer size={15} /> Print Label
              </button>
              <button onClick={() => { toast.success('Marked as packed'); setSelected(null) }} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium">
                Mark as Packed
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
