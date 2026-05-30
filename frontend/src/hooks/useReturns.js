import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_RETURNS } from '../lib/mockData'

export function useReturns({ accountId = 'all', status = 'All' } = {}) {
  return useQuery({
    queryKey: ['returns', accountId, status],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (status && status !== 'All') params.status = status
        const { data } = await api.get('/returns', { params })
        return data
      } catch {
        return MOCK_RETURNS.filter(r => {
          const accId = r.accountId?._id || r.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (status !== 'All' && r.status !== status) return false
          return true
        })
      }
    },
  })
}
