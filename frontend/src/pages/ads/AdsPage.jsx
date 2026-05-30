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
    image: IMG_THUMB,
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
    image: IMG_THUMB,
  },
]

const STATS = [
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

export default function AdsPage() {
  const [accountId, setAccountId] = useState('all')
  const [activeListingTab, setActiveListingTab] = useState(0)
  const [overviewPeriod, setOverviewPeriod] = useState('Last 30 Days')

  const { accounts } = useAccounts()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Advertisement</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Free Credits badge */}
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
            <Coins size={14} className="text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-700">₹0 Free Credits Available!</span>
          </div>

          {/* How it works */}
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            How it works?
          </button>

          {/* Account selector */}
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
          </select>

          {/* Create New Ad */}
          <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={15} />
            Create New Ad
          </button>
        </div>
      </div>

      {/* Yellow promo banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">
            Increase Ad budget &amp; get up to 2x more orders (7th June FSMS)
          </p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-xs text-slate-700">
              <span className="text-green-500 font-bold">✓</span>
              Create campaigns to get more orders with ads
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-700">
              <span className="text-green-500 font-bold">✓</span>
              Increase budget on top sale campaigns
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-slate-500">Boost orders now!</p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Add Budget
          </button>
        </div>
      </div>

      {/* NEW badge row */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
        <span className="text-sm text-slate-700">ROI Ads are now ROI Plus ads</span>
      </div>

      {/* Hero section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="text-5xl mb-3">💰</div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Set any ROI you want for your ads</h2>
        <p className="text-sm text-slate-500 mb-5">Zero Risk, Maximum Orders</p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
          Create New Campaign
        </button>
      </div>

      {/* Overview section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-900">Overview</span>
          <div className="relative">
            <select
              value={overviewPeriod}
              onChange={e => setOverviewPeriod(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-600"
            >
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs text-slate-500">{stat.label}</span>
                <Info size={11} className="text-slate-400 flex-shrink-0" />
              </div>
              <p className="text-base font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Listing Ads section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section title */}
        <div className="px-4 pt-4 pb-0">
          <p className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-2 inline-block">
            Listing Ads
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {LISTING_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveListingTab(i)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeListingTab === i
                  ? 'border-b-2 border-indigo-600 text-indigo-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs ${activeListingTab === i ? 'text-indigo-600' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
              {tab.info && <Info size={11} className="text-slate-400" />}
              {tab.isNew && (
                <span className="bg-purple-600 text-white text-xs font-bold px-1 py-0.5 rounded leading-none">
                  NEW
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-500 w-52">Campaign</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Budget</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Budget Utilized</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Impressions</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Orders</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Revenue</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Avg ROI</th>
                <th className="text-left py-3 px-3 font-medium text-slate-500">Performance / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_ADS.map((ad) => (
                <tr key={ad._id} className="hover:bg-slate-50 transition-colors align-top">
                  {/* Campaign */}
                  <td className="py-4 px-4">
                    <div className="flex items-start gap-2">
                      <img src={ad.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      <div>
                        <a href="#" className="text-indigo-600 hover:underline font-medium text-xs leading-snug">
                          {ad.name}
                        </a>
                        <p className="text-slate-400 text-xs">ID {ad.adId}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{ad.dateRange}</p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            ad.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {ad.status}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Budget */}
                  <td className="py-4 px-3 text-slate-700 font-medium">{ad.budget}</td>

                  {/* Budget Utilized */}
                  <td className="py-4 px-3 text-slate-700">
                    ₹{ad.budgetUtilized.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Impressions */}
                  <td className="py-4 px-3">
                    <p className="text-slate-700">Views: {ad.views.toLocaleString('en-IN')}</p>
                    {ad.clicks != null && (
                      <p className="text-slate-500">Clicks: {ad.clicks.toLocaleString('en-IN')}</p>
                    )}
                  </td>

                  {/* Orders */}
                  <td className="py-4 px-3 text-slate-700 font-medium">{ad.orders}</td>

                  {/* Revenue */}
                  <td className="py-4 px-3 text-slate-700">
                    ₹{ad.revenue.toLocaleString('en-IN')}
                  </td>

                  {/* Avg ROI */}
                  <td className="py-4 px-3 text-slate-700 font-medium">{ad.avgRoi}</td>

                  {/* Actions */}
                  <td className="py-4 px-3">
                    {ad.hasRecommendation ? (
                      <div>
                        <span className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                          ★ Recommendation
                        </span>
                        <p className="text-slate-600 text-xs mb-2">{ad.recommendationText}</p>
                        <div className="flex gap-2">
                          <button className="text-indigo-600 hover:underline text-xs font-medium">
                            Update Budget
                          </button>
                          <span className="text-slate-300">|</span>
                          <button className="text-indigo-600 hover:underline text-xs font-medium">
                            See Details
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="text-indigo-600 hover:underline text-xs font-medium">
                        See Details
                      </button>
                    )}
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
