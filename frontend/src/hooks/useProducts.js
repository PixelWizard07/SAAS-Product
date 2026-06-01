import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_PRODUCTS } from '../lib/mockData'

const LS_KEY = 'meeshohub_products'

const getLocalProducts = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : MOCK_PRODUCTS
  } catch {
    return MOCK_PRODUCTS
  }
}

export function useProducts({ accountId = 'all', search = '' } = {}) {
  return useQuery({
    queryKey: ['products', accountId, search],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (search) params.search = search
        const { data } = await api.get('/products', { params })
        const products = data.products ?? data
        if (Array.isArray(products) && products.length > 0 && !search) {
          try { localStorage.setItem(LS_KEY, JSON.stringify(products)) } catch {}
        }
        return products
      } catch {
        return getLocalProducts().filter(p => {
          const accId = p.accountId?._id || p.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) &&
              !p.sku?.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
      }
    },
  })
}
