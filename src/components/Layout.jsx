import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
