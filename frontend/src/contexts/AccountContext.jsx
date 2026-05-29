import { createContext, useContext, useState } from 'react'

const AccountContext = createContext(null)

export const AccountProvider = ({ children }) => {
  const [selectedAccountId, setSelectedAccountId] = useState('all')

  return (
    <AccountContext.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)
