import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDark = () => {
    setDarkMode(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar darkMode={darkMode} toggleDark={toggleDark} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
