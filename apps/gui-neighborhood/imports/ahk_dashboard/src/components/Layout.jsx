import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen relative">
      {/* 🌀 Floating Geometric Shapes (from AHK letterhead) */}
      <div className="floating-shapes">
        <div className="shape circle"></div>
        <div className="shape diamond"></div>
        <div className="shape circle"></div>
      </div>

      {/* Premium Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content Area with Glass Effect */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Premium Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Content with Animated Entry */}
        <main className="p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
