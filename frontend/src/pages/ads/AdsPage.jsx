import { useState } from 'react'
import { Plus, ChevronDown, Info, Coins } from 'lucide-react'
import { useAccounts } from '../../hooks/useAccounts'

const IMG_THUMB = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23FDE68A'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='22'>👗</text></svg>`

const MOCK_ADS = [
  {
    _id: 'ad1',
    name: '138503 - 3/24/2026',
    adId: '20579929',
    dateRange: '24 Mar 2026 - No end date',
    status: 'LIVE',
    budget: '₹220 / Daily',
    budgetUtilized: 7213.7,
    views: 1328214,
    clicks: 32374,
    orders: 377,
    revenue: 141438,
    avgRoi: 19.61,
    hasRecommendation: true,
    recommendationText: 'Update your budget to ₹300 and get up to 8 daily orders!',
  },
  {
    _id: 'ad2',
    name: '138503 - 3/21/2026',
    adId: '20579799',
    dateRange: '21 Mar 2026 - No end date',
    status: 'Optimizing',
    budget: '₹200',
    budgetUtilized: 26520.58,
    views: 5829409,
    clicks: null,
    orders: 1133,
    revenue: 326734,
    avgRoi: 12.32,
    hasRecommendation: false,
    recommendationText: null,
  },
]

const OVERVIEW_STATS = [
  { label: 'Ad Spend', value: '₹12,290.11' },
  { label: 'Revenue', value: '₹1,92,318' },
  { label: 'ROI', value: '15.7' },
  { label: 'Views', value: '30,36,727' },
  { label: 'Clicks', value: '53,916' },
  { label: 'Orders', value: '597' },
]

const LISTING_TABS = [
  { label: 'ALL', count: 238 },
  { label: 'LIVE', count: 2 },
  { label: 'PAUSED', count: 236 },
  { label: 'UPCOMING', count: 0 },
  { label: 'RECOMMENDATIONS', count: 1, info: true },
  { label: 'SALE', count: 1, isNew: true },
]

function StatusBadge({ status }) {
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
        ● LIVE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      {status}
    </span>
  )
}

export default function AdsPage() {
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [activeListingTab, setActiveListingTab] = useState(0)
  const [overviewPeriod, setOverviewPeriod] = useState('Last 30 Days')

  const { accounts } = useAccounts()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Advertisement</h1>
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

            {/* Free credits badge */}
            <div className="flex items-center gap-1.5 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-yellow-600" />
              ₹0 Free Credits Available!
            </div>

            {/* How it works */}
            <button className="text-indigo-600 text-sm font-medium hover:underline">
              How it works?
            </button>

            {/* Create New Ad */}
            <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              <Plus className="w-4 h-4" />
              Create New Ad
            </button>
          </div>
        </div>

        {/* Yellow Promo Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-2">
              Increase Ad budget &amp; get up to 2x more orders (7th June FSMS)
            </p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Create campaigns to get more orders with ads
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Increase budget on top sale campaigns
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <p className="text-xs text-gray-500">Boost orders now!</p>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Add Budget
            </button>
          </div>
        </div>

        {/* NEW badge row */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            NEW
          </span>
          <span className="text-sm text-gray-700">ROI Ads are now ROI Plus ads</span>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set any ROI you want for your ads</h2>
          <p className="text-gray-500 mb-6">Zero Risk, Maximum Orders</p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors">
            Create New Campaign
          </button>
        </div>

        {/* Overview Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">Overview</span>
            <div className="relative">
              <select
                value={overviewPeriod}
                onChange={(e) => setOverviewPeriod(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {OVERVIEW_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                  {stat.label}
                  <Info className="w-3 h-3 text-gray-400" />
                </div>
                <div className="font-bold text-gray-900 text-base">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Listing Ads Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Section header */}
          <div className="px-5 pt-5 pb-0">
            <h3 className="font-bold text-gray-900 text-base border-b-2 border-indigo-600 inline-block pb-2 mb-0">
              Listing Ads
            </h3>
          </div>

          {/* Sub tabs */}
          <div className="flex border-b border-gray-200 px-5 overflow-x-auto">
            {LISTING_TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveListingTab(i)}
                className={`flex items-center gap-1 py-3 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors mr-1 ${
                  activeListingTab === i
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}({tab.count})
                {tab.info && <Info className="w-3 h-3" />}
                {tab.isNew && (
                  <span className="ml-1 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    NEW
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Campaign</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Budget</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Budget Utilized</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Impressions</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Orders</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Revenue</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Avg ROI</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Performance / Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ADS.map((ad) => (
                  <tr key={ad._id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    {/* Campaign */}
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="flex items-start gap-3">
                        <img
                          src={IMG_THUMB}
                          alt="product"
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <a href="#" className="text-indigo-600 hover:underline font-medium text-xs block">{ad.name}</a>
                          <p className="text-xs text-gray-400">ID {ad.adId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ad.dateRange}</p>
                          <div className="mt-1">
                            <StatusBadge status={ad.status} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-4 px-3 text-xs text-gray-700 whitespace-nowrap">{ad.budget}</td>

                    {/* Budget Utilized */}
                    <td className="py-4 px-3 text-xs text-gray-700">
                      ₹{ad.budgetUtilized.toLocaleString('en-IN')}
                    </td>

                    {/* Impressions */}
                    <td className="py-4 px-3 text-xs text-gray-700">
                      <div>Views: {ad.views.toLocaleString('en-IN')}</div>
                      {ad.clicks !== null && (
                        <div>Clicks: {ad.clicks.toLocaleString('en-IN')}</div>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="py-4 px-3 text-xs text-gray-700">{ad.orders}</td>

                    {/* Revenue */}
                    <td className="py-4 px-3 text-xs text-gray-700">
                      {ad.revenue.toLocaleString('en-IN')}
                    </td>

                    {/* Avg ROI */}
                    <td className="py-4 px-3 text-xs text-gray-700">{ad.avgRoi}</td>

                    {/* Actions */}
                    <td className="py-4 px-3 min-w-[200px]">
                      {ad.hasRecommendation ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                            ★ Recommendation
                          </span>
                          <p className="text-xs text-gray-600">{ad.recommendationText}</p>
                          <div className="flex gap-3">
                            <a href="#" className="text-xs text-indigo-600 hover:underline font-medium">Update Budget</a>
                            <a href="#" className="text-xs text-indigo-600 hover:underline font-medium">See Details</a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <a href="#" className="text-xs text-indigo-600 hover:underline font-medium">See Details</a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
