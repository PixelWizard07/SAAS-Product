import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_PAYMENTS } from '../lib/mockData'

const LS_KEY = 'meeshohub_payments'

const getLocalPayments = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : MOCK_PAYMENTS
  } catch {
    return MOCK_PAYMENTS
  }
}

export function usePayments({ accountId = 'all' } = {}) {
  return useQuery({
    queryKey: ['payments', accountId],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        const { data } = await api.get('/payments', { params })
        const payments = data.payments ?? data
        if (Array.isArray(payments) && payments.length > 0) {
          try { localStorage.setItem(LS_KEY, JSON.stringify(payments)) } catch {}
        }
        return payments
      } catch {
        return getLocalPayments().filter(p => {
          const accId = p.accountId?._id || p.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          return true
        })
      }
    },
  })
}
