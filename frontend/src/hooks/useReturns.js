import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_RETURNS } from '../lib/mockData'

const LS_KEY = 'meeshohub_returns'

const getLocalReturns = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : MOCK_RETURNS
  } catch {
    return MOCK_RETURNS
  }
}

export function useReturns({ accountId = 'all', status = 'All' } = {}) {
  return useQuery({
    queryKey: ['returns', accountId, status],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (status && status !== 'All') params.status = status
        const { data } = await api.get('/returns', { params })
        const returns = data.returns ?? data
        if (Array.isArray(returns) && returns.length > 0 && status === 'All') {
          try { localStorage.setItem(LS_KEY, JSON.stringify(returns)) } catch {}
        }
        return returns
      } catch {
        return getLocalReturns().filter(r => {
          const accId = r.accountId?._id || r.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (status !== 'All' && r.status !== status) return false
          return true
        })
      }
    },
  })
}
