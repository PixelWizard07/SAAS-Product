import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_ACCOUNTS, MOCK_ORDERS, MOCK_RETURNS, MOCK_PRODUCTS, MOCK_PAYMENTS } from '../lib/mockData'
import toast from 'react-hot-toast'

const LS_KEY = 'meeshohub_accounts'
const LS_ORDERS = 'meeshohub_orders'
const LS_RETURNS = 'meeshohub_returns'
const LS_PRODUCTS = 'meeshohub_products'
const LS_PAYMENTS = 'meeshohub_payments'

const getLocalAccounts = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const setLocalAccounts = (accounts) => {
  localStorage.setItem(LS_KEY, JSON.stringify(accounts))
}

// Seed mock data into localStorage for an account in demo mode
const seedLocalDemoData = (accountId, nickname) => {
  const tag = (arr) => arr.map(o => ({ ...o, accountId: { _id: accountId, nickname } }))
  try {
    const orders = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]')
    const hasOrders = orders.some(o => (o.accountId?._id || o.accountId) === accountId)
    if (!hasOrders) {
      const seeded = tag(MOCK_ORDERS).map((o, i) => ({ ...o, _id: `${accountId}_o${i}`, accountId: { _id: accountId, nickname } }))
      localStorage.setItem(LS_ORDERS, JSON.stringify([...orders, ...seeded]))
    }
    const returns = JSON.parse(localStorage.getItem(LS_RETURNS) || '[]')
    const hasReturns = returns.some(r => (r.accountId?._id || r.accountId) === accountId)
    if (!hasReturns) {
      const seeded = tag(MOCK_RETURNS).map((r, i) => ({ ...r, _id: `${accountId}_r${i}`, accountId: { _id: accountId, nickname } }))
      localStorage.setItem(LS_RETURNS, JSON.stringify([...returns, ...seeded]))
    }
    const products = JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]')
    const hasProd = products.some(p => (p.accountId?._id || p.accountId) === accountId)
    if (!hasProd) {
      const seeded = tag(MOCK_PRODUCTS).map((p, i) => ({ ...p, _id: `${accountId}_p${i}`, accountId: { _id: accountId, nickname } }))
      localStorage.setItem(LS_PRODUCTS, JSON.stringify([...products, ...seeded]))
    }
    const payments = JSON.parse(localStorage.getItem(LS_PAYMENTS) || '[]')
    const hasPay = payments.some(p => (p.accountId?._id || p.accountId) === accountId)
    if (!hasPay) {
      const seeded = tag(MOCK_PAYMENTS).map((p, i) => ({ ...p, _id: `${accountId}_pay${i}`, accountId: { _id: accountId, nickname } }))
      localStorage.setItem(LS_PAYMENTS, JSON.stringify([...payments, ...seeded]))
    }
  } catch {}
}

export function useAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounts')
        // Only update localStorage when we get a non-empty, valid response
        if (Array.isArray(data) && data.length > 0) {
          setLocalAccounts(data)
        }
        // If API returns empty but we have local accounts, prefer local
        const local = getLocalAccounts()
        return data.length > 0 ? data : local
      } catch {
        return getLocalAccounts()
      }
    },
    refetchInterval: (query) => {
      const arr = query?.state?.data ?? []
      return arr.some(a => a.status === 'syncing') ? 5000 : false
    },
  })

  const addMutation = useMutation({
    mutationFn: async (form) => {
      try {
        const { data } = await api.post('/accounts', form)
        return { ...data, _fromServer: true }
      } catch {
        const newAcc = {
          _id: `local_${Date.now()}`,
          nickname: form.nickname,
          phone: form.phone,
          shopName: form.nickname,
          profilePicture: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
          status: 'inactive',
          lastSyncAt: null,
          _isLocal: true,
        }
        const current = getLocalAccounts()
        setLocalAccounts([...current, newAcc])
        return newAcc
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account added! Click Sync to fetch your Meesho data.')
    },
    onError: () => toast.error('Failed to add account'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Remove from localStorage first (always)
      const current = getLocalAccounts()
      setLocalAccounts(current.filter(a => a._id !== id))
      // Also remove from server if reachable
      try { await api.delete(`/accounts/${id}`) } catch {}
      // Remove associated local demo data
      ;[LS_ORDERS, LS_RETURNS, LS_PRODUCTS, LS_PAYMENTS].forEach(key => {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]')
          localStorage.setItem(key, JSON.stringify(
            items.filter(x => (x.accountId?._id || x.accountId) !== id)
          ))
        } catch {}
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Account removed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (id) => {
      // Mark account as syncing in local state immediately
      const current = getLocalAccounts()
      const acc = current.find(a => a._id === id)
      const updated = current.map(a => a._id === id ? { ...a, status: 'syncing' } : a)
      setLocalAccounts(updated)
      queryClient.setQueryData(['accounts'], updated)

      try {
        const { data } = await api.post(`/accounts/${id}/sync`)
        return { ...data, _fromServer: true, accountId: id, nickname: acc?.nickname }
      } catch {
        // Demo mode: simulate sync locally
        return { _demo: true, accountId: id, nickname: acc?.nickname }
      }
    },
    onSuccess: (result) => {
      toast.success('Sync started — fetching your Meesho data…')

      if (result._demo) {
        // Demo mode: simulate scraping delay, then seed mock data
        const { accountId, nickname } = result
        setTimeout(() => {
          seedLocalDemoData(accountId, nickname || 'My Store')
          const current = getLocalAccounts()
          const done = current.map(a => a._id === accountId
            ? { ...a, status: 'active', lastSyncAt: new Date().toISOString() }
            : a)
          setLocalAccounts(done)
          queryClient.setQueryData(['accounts'], done)
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['returns'] })
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['payments'] })
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          toast.success('Sync complete — your Meesho data is ready!')
        }, 3000)
        return
      }

      // Real backend: poll until sync completes (max 3 min)
      let attempts = 0
      const maxAttempts = 36 // 36 × 5s = 3 min
      const poll = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(poll)
          toast.error('Sync is taking too long — check back later')
          return
        }
        try {
          const { data } = await api.get('/accounts')
          // Only update if we received real data
          if (Array.isArray(data) && data.length > 0) {
            setLocalAccounts(data)
            queryClient.setQueryData(['accounts'], data)
            const stillSyncing = data.some(a => a.status === 'syncing')
            if (!stillSyncing) {
              clearInterval(poll)
              queryClient.invalidateQueries({ queryKey: ['orders'] })
              queryClient.invalidateQueries({ queryKey: ['returns'] })
              queryClient.invalidateQueries({ queryKey: ['products'] })
              queryClient.invalidateQueries({ queryKey: ['payments'] })
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              toast.success('Sync complete — Meesho data loaded!')
            }
          }
          // If data is empty or API errored, silently wait — don't touch state
        } catch {
          // API temporarily unreachable — keep waiting, don't touch accounts
        }
      }, 5000)
    },
    onError: () => {
      // Restore account status to previous
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.error('Sync failed — check your credentials')
    },
  })

  const seedMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/accounts/${id}/seed`)
      return { ...data, accountId: id }
    },
    onSuccess: (result) => {
      toast.success(`Demo data loaded — ${result.orders} orders ready!`)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to load demo data — check your backend connection'),
  })

  return {
    accounts,
    isLoading,
    error,
    addAccount: addMutation.mutate,
    isAdding: addMutation.isPending,
    deleteAccount: deleteMutation.mutate,
    syncAccount: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncingId: syncMutation.variables,
    seedAccount: seedMutation.mutate,
    isSeeding: seedMutation.isPending,
    seedingId: seedMutation.variables,
  }
}
