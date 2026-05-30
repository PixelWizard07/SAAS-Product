import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Download, ChevronDown, Search, Truck } from 'lucide-react'
import { format, subDays, addDays } from 'date-fns'
import { usePayments } from '../../hooks/usePayments'
import { useAccounts } from '../../hooks/useAccounts'

// Generate 30-day chart data
const generateChartData = () => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i)
    const label = format(d, 'dd.MM')
    data.push({
      date: label,
      paymentsToDate: Math.floor(10000 + Math.random() * 30000),
      outstanding: Math.floor(5000 + Math.random() * 20000),
    })
  }
  return data
}

const CHART_DATA = generateChartData()

const toK = (amount) => {
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`
  return `₹${amount}`
}

const formatRupee = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Upcoming payment tabs — next 3 days
const UPCOMING_TABS = [
  { label: '1 Jun, 26', amount: 29608, amountK: '₹29.60K', data: { orders: 30344.71, ads: -736.27, program: 0, loan: null, benefits: 0, referral: 0, net: 29608, neftId: null } },
  { label: '2 Jun, 26', amount: 12250, amountK: '₹12.25K', data: { orders: 13100.00, ads: -450.00, program: 0, loan: null, benefits: 0, referral: 0, net: 12250, neftId: null } },
  { label: '3 Jun, 26', amount: 8540, amountK: '₹8.54K', data: { orders: 9100.00, ads: -300.00, program: 0, loan: null, benefits: 0, referral: 0, net: 8540, neftId: null } },
]

// Completed payment tabs — last 3 days
const COMPLETED_TABS = [
  { label: '29 May, 26', amount: 13417, amountK: '₹13.41K', data: { orders: 14170.31, ads: -752.33, program: 0, loan: 0, benefits: 0, referral: 0, net: 13417, neftId: 'AXISCN1358405179' } },
  { label: '27 May, 26', amount: 6920, amountK: '₹6.92K', data: { orders: 7500.00, ads: -280.00, program: 0, loan: 0, benefits: 0, referral: 0, net: 6920, neftId: 'AXISCN1358405112' } },
  { label: '26 May, 26', amount: 7200, amountK: '₹7.20K', data: { orders: 7850.00, ads: -310.00, program: 0, loan: 0, benefits: 0, referral: 0, net: 7200, neftId: 'AXISCN1358405098' } },
]

function PaymentTable({ tabData, isUpcoming }) {
  const { orders, ads, program, loan, benefits, referral, net, neftId } = tabData
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Transaction Type</th>
          <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Details</th>
          <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-700 font-medium">Orders</td>
          <td className="py-2 px-3 text-gray-600">Sales and returns</td>
          <td className="py-2 px-3 text-right text-indigo-600 font-medium">{formatRupee(orders)}</td>
        </tr>
        <tr className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-700 font-medium">Net platform recovery</td>
          <td className="py-2 px-3 text-gray-600">Ads Cost</td>
          <td className="py-2 px-3 text-right text-red-500 font-medium">{ads < 0 ? `−${formatRupee(Math.abs(ads))}` : formatRupee(ads)}</td>
        </tr>
        <tr className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-400"></td>
          <td className="py-2 px-3 text-gray-600">Program Cost</td>
          <td className="py-2 px-3 text-right text-gray-700">₹0</td>
        </tr>
        <tr className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-400"></td>
          <td className="py-2 px-3 text-gray-600">Loan Settlements</td>
          <td className="py-2 px-3 text-right">
            {loan === null ? (
              <span className="text-gray-400 text-xs">To be calculated</span>
            ) : (
              <span className="text-gray-700">₹0</span>
            )}
          </td>
        </tr>
        <tr className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-700 font-medium">Net platform compensation</td>
          <td className="py-2 px-3 text-gray-600">Program Benefits</td>
          <td className="py-2 px-3 text-right text-gray-700">₹0</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="py-2 px-3 text-gray-400"></td>
          <td className="py-2 px-3 text-gray-600">Referral Earnings</td>
          <td className="py-2 px-3 text-right text-gray-700">₹0</td>
        </tr>
        <tr className="bg-gray-50">
          <td className="py-3 px-3 font-semibold text-gray-800">Net amount</td>
          <td className="py-3 px-3 text-xs text-gray-400">
            {isUpcoming ? 'Amount may vary after loan is settled.' : (neftId ? `NEFT ID: ${neftId}` : '')}
          </td>
          <td className="py-3 px-3 text-right font-bold text-gray-900">
            ₹{net.toLocaleString('en-IN')}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const formatYAxis = (value) => {
  if (value === 0) return '₹0'
  return `₹${(value / 1000).toFixed(2)}K`
}

export default function PaymentsPage() {
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [upcomingTab, setUpcomingTab] = useState(0)
  const [completedTab, setCompletedTab] = useState(0)
  const [searchType, setSearchType] = useState('Order / Sub Order No.')

  const { accounts } = useAccounts()
  const { data: payments } = usePayments({ accountId: selectedAccount })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Account selector */}
            <div className="relative">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>{acc.nickname}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Search type dropdown */}
            <div className="relative">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option>Order / Sub Order No.</option>
                <option>Transaction ID</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
              />
            </div>

            {/* Download button */}
            <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              <Download className="w-4 h-4" />
              Download
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-column grid: Upcoming + Completed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT: Upcoming Payments */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-lg flex-shrink-0">⏳</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Upcoming Payments</p>
                  <p className="text-xs text-gray-500 mt-0.5">Updated as of 30 May 2026 7:27 AM</p>
                </div>
              </div>
            </div>

            {/* Date tabs */}
            <div className="flex border-b border-gray-200">
              {UPCOMING_TABS.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setUpcomingTab(i)}
                  className={`flex-1 py-3 px-2 text-center text-xs transition-colors ${
                    upcomingTab === i
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="text-gray-600 text-xs">{tab.label}</div>
                  <div className={`font-semibold mt-0.5 ${upcomingTab === i ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {tab.amountK}
                  </div>
                </button>
              ))}
            </div>

            {/* Table */}
            <PaymentTable tabData={UPCOMING_TABS[upcomingTab].data} isUpcoming={true} />
          </div>

          {/* RIGHT: Completed Payments */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Completed Payments</p>
                  <p className="text-xs text-gray-500 mt-0.5">Settled to your bank account</p>
                </div>
              </div>
            </div>

            {/* Date tabs */}
            <div className="flex border-b border-gray-200">
              {COMPLETED_TABS.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setCompletedTab(i)}
                  className={`flex-1 py-3 px-2 text-center text-xs transition-colors ${
                    completedTab === i
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="text-gray-600 text-xs">{tab.label}</div>
                  <div className={`font-semibold mt-0.5 ${completedTab === i ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {tab.amountK}
                  </div>
                </button>
              ))}
            </div>

            {/* Table */}
            <PaymentTable tabData={COMPLETED_TABS[completedTab].data} isUpcoming={false} />
          </div>
        </div>

        {/* Unscheduled Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Unscheduled Payments</p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
                Payments expected from your shipped orders. Once delivered, we will automatically move it to your upcoming payments.
              </p>
            </div>
          </div>
          <button className="flex-shrink-0 border border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 text-sm font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap">
            View Details
          </button>
        </div>

        {/* Payments over time chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Payments over time</h2>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                Payments to Date
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>
                Outstanding Payment
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 50000]}
                ticks={[0, 12500, 25000, 37500, 50000]}
              />
              <Tooltip
                formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name === 'paymentsToDate' ? 'Payments to Date' : 'Outstanding Payment']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="paymentsToDate"
                name="Payments to Date"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="outstanding"
                name="Outstanding Payment"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-400 text-center mt-2">
            The graph shows daily view of your 30 days payments
          </p>
        </div>

      </div>
    </div>
  )
}
