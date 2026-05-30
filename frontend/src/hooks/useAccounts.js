import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_ACCOUNTS } from '../lib/mockData'
import toast from 'react-hot-toast'

const LS_KEY = 'meeshohub_accounts'

const getLocalAccounts = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : MOCK_ACCOUNTS
  } catch {
    return MOCK_ACCOUNTS
  }
}

const setLocalAccounts = (accounts) => {
  localStorage.setItem(LS_KEY, JSON.stringify(accounts))
}

export function useAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounts')
        setLocalAccounts(data)
        return data
      } catch (err) {
        return getLocalAccounts()
      }
    },
    // Poll every 5s when any account is syncing so UI reflects status changes
    refetchInterval: (data) => {
      const arr = data?.state?.data ?? []
      return arr.some(a => a.status === 'syncing') ? 5000 : false
    },
  })

  const addMutation = useMutation({
    mutationFn: async (form) => {
      try {
        const { data } = await api.post('/accounts', form)
        return data
      } catch {
        // Demo mode: create locally
        const newAcc = {
          _id: `local_${Date.now()}`,
          nickname: form.nickname,
          phone: form.phone,
          shopName: 'Fetching…',
          profilePicture: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
          status: 'inactive',
          lastSyncAt: null,
        }
        const current = getLocalAccounts()
        setLocalAccounts([...current, newAcc])
        return newAcc
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account added! Sync to fetch data.')
    },
    onError: () => toast.error('Failed to add account'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await api.delete(`/accounts/${id}`)
      } catch {
        const current = getLocalAccounts()
        setLocalAccounts(current.filter(a => a._id !== id))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account removed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const { data } = await api.post(`/accounts/${id}/sync`)
        return data
      } catch {
        // Demo: update local status
        const current = getLocalAccounts()
        setLocalAccounts(current.map(a => a._id === id ? { ...a, status: 'active', lastSyncAt: new Date().toISOString() } : a))
        return { orders: 10, returns: 3 }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Sync started — logging into Meesho to fetch your data…')
      // Poll accounts until sync completes, then refresh all data
      const poll = setInterval(async () => {
        const { data } = await api.get('/accounts').catch(() => ({ data: [] }))
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
      }, 5000)
      // Safety: stop polling after 3 minutes
      setTimeout(() => clearInterval(poll), 3 * 60 * 1000)
    },
    onError: () => toast.error('Sync failed'),
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
  }
}
