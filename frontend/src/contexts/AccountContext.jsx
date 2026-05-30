import { createContext, useContext, useState } from 'react'

const AccountContext = createContext(null)

const LS_KEY = 'meeshohub_selected_account'

export const AccountProvider = ({ children }) => {
  const [selectedAccountId, setSelectedAccountIdState] = useState(
    () => localStorage.getItem(LS_KEY) || 'all'
  )

  const setSelectedAccountId = (id) => {
    setSelectedAccountIdState(id)
    localStorage.setItem(LS_KEY, id)
  }

  return (
    <AccountContext.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)
