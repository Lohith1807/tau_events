import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { FiMenu, FiSearch, FiBell } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';


const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      
      {/* GLOBAL MOBILE HEADER - Only shows on mobile via CSS */}
      <header className="mobile-top-header">
        {isSearchActive ? (
          <div className="mobile-search-active-bar" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px' }}>
            <FiSearch className="icon-btn" onClick={() => setSearchActive(false)} />
            <input 
              type="text" 
              autoFocus
              placeholder="Search posts or events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', padding: '6px 12px', color: 'white', outline: 'none' }}
            />
            <span style={{ fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => { setSearchQuery(''); setSearchActive(false); }}>✕</span>
          </div>
        ) : (
          <>
            <div className="header-left">
              <FiMenu className="icon-btn" onClick={() => setSidebarOpen(!isSidebarOpen)} />
              <span className="app-title">TAU - EVENTS</span>
            </div>
            <div className="header-right">
              <FiSearch className="icon-btn" onClick={() => setSearchActive(true)} />
              {user?.role && user.role !== 'student' && (
                <MdQrCodeScanner 
                  className="icon-btn" 
                  title="Scanner" 
                  onClick={() => navigate('/scanner')} 
                />
              )}
              <FiBell className="icon-btn" onClick={() => navigate('/notifications')} />
            </div>
          </>
        )}
      </header>

      <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <main className="main-content">
        <Outlet context={{ 
          toggleSidebar: () => setSidebarOpen(!isSidebarOpen),
          searchQuery 
        }} />
      </main>
    </div>
  );
};



export default DashboardLayout;
