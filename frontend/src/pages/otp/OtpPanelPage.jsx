import { useState, useEffect } from 'react'
import { Copy, CheckCircle, RefreshCw, Clock } from 'lucide-react'
import { MOCK_RETURNS } from '../../lib/mockData'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function OtpPanelPage() {
  const [otpReturns, setOtpReturns] = useState(MOCK_RETURNS.filter(r => r.otp))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = (otp) => {
    navigator.clipboard.writeText(otp)
    toast.success('OTP copied to clipboard!')
  }

  const handleMarkUsed = (id) => {
    setOtpReturns(r => r.map(x => x._id === id ? { ...x, otpUsed: true } : x))
    toast.success('OTP marked as used')
  }

  const handleRefresh = (id) => {
    toast.promise(
      new Promise(r => setTimeout(r, 1500)),
      { loading: 'Refreshing OTP…', success: 'OTP refreshed', error: 'Refresh failed' }
    )
  }

  const getAge = (ts) => {
    if (!ts) return ''
    const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (secs < 60) return `${secs}s ago`
    return formatDistanceToNow(new Date(ts), { addSuffix: true })
  }

  const activeOtps = otpReturns.filter(r => !r.otpUsed)
  const usedOtps = otpReturns.filter(r => r.otpUsed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Return OTP Panel</h1>
        <p className="text-slate-500 text-sm mt-0.5">All active return OTPs across your accounts in one place</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-semibold text-green-700">{activeOtps.length}</span>
          <span className="text-green-600 ml-1">Active OTPs</span>
        </div>
        <div className="bg-slate-100 rounded-xl px-4 py-2 text-sm">
          <span className="font-semibold text-slate-700">{usedOtps.length}</span>
          <span className="text-slate-500 ml-1">Used</span>
        </div>
      </div>

      {activeOtps.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Active OTPs</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeOtps.map(ret => (
              <div key={ret._id} className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-4">
                  <img src={ret.productImage} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{ret.productName}</p>
                    <p className="text-xs text-slate-500">{ret.orderId}</p>
                    <p className="text-xs font-medium text-brand-600 mt-0.5">{ret.accountId.nickname}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center mb-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Return OTP</p>
                  <p className="text-3xl font-bold text-green-700 tracking-[0.3em]">{ret.otp}</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-green-500">
                    <Clock size={12} />
                    <span>Generated {getAge(ret.otpGeneratedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleCopy(ret.otp)} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                    <Copy size={14} /> Copy OTP
                  </button>
                  <button onClick={() => handleRefresh(ret._id)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
                    <RefreshCw size={15} />
                  </button>
                  <button onClick={() => handleMarkUsed(ret._id)} className="p-2 rounded-xl border border-green-200 hover:bg-green-50 text-green-600">
                    <CheckCircle size={15} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-2 text-center">Buyer: {ret.buyerName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {usedOtps.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Used OTPs</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {usedOtps.map(ret => (
              <div key={ret._id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <img src={ret.productImage} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-200" />
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{ret.productName}</p>
                    <p className="text-xs text-slate-400">{ret.orderId} · OTP used</p>
                  </div>
                  <CheckCircle size={16} className="ml-auto text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeOtps.length === 0 && usedOtps.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Key size={40} className="mx-auto mb-3 opacity-30" />
          <p>No return OTPs available</p>
          <p className="text-sm mt-1">OTPs will appear here when returns are initiated</p>
        </div>
      )}
    </div>
  )
}
