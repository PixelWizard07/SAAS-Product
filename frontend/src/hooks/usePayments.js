import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_PAYMENTS } from '../lib/mockData'

export function usePayments({ accountId = 'all' } = {}) {
  return useQuery({
    queryKey: ['payments', accountId],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        const { data } = await api.get('/payments', { params })
        return data.payments ?? data
      } catch {
        return MOCK_PAYMENTS.filter(p => {
          const accId = p.accountId?._id || p.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          return true
        })
      }
    },
  })
}
