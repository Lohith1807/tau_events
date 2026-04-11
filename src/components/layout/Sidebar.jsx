import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiHome, FiCalendar, FiUsers, FiFileText, FiSettings,
  FiCheckSquare, FiSend, FiList, FiPlusCircle, FiCreditCard,
  FiBell, FiBarChart2, FiShield, FiBookOpen, FiX, FiLogOut
} from 'react-icons/fi';

const roleMenus = {
  admin: [
    {
      section: 'Overview', items: [
        { to: '/home', label: 'Home', icon: <FiHome /> },
        { to: '/all-events', label: 'All Events', icon: <FiCalendar /> },
        { to: '/dashboard', label: 'Dashboard', icon: <FiBarChart2 /> },
      ]
    },
    {
      section: 'Management', items: [
        { to: '/admin/users', label: 'User Management', icon: <FiUsers /> },
        { to: '/admin/events', label: 'All Events', icon: <FiCalendar /> },
        { to: '/admin/posts', label: 'Manage Posts', icon: <FiBookOpen /> },
      ]
    },
    {
      section: 'System', items: [
        { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      ]
    },
  ],
  registrar: [
    {
      section: 'Overview', items: [
        { to: '/home', label: 'Home', icon: <FiHome /> },
        { to: '/all-events', label: 'All Events', icon: <FiCalendar /> },
        { to: '/dashboard', label: 'Dashboard', icon: <FiBarChart2 /> },
      ]
    },
    {
      section: 'Approvals', items: [
        { to: '/registrar/events', label: 'Event Approvals', icon: <FiCheckSquare /> },
      ]
    },
    {
      section: 'System', items: [
        { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      ]
    },
  ],
  dean: [
    {
      section: 'Overview', items: [
        { to: '/home', label: 'Home', icon: <FiHome /> },
        { to: '/all-events', label: 'All Events', icon: <FiCalendar /> },
      ]
    },
    {
      section: 'Review', items: [
        { to: '/dean/events', label: 'Event Review', icon: <FiSend /> },
      ]
    },
    {
      section: 'System', items: [
        { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      ]
    },
  ],
  faculty: [
    {
      section: 'Overview', items: [
        { to: '/home', label: 'Home', icon: <FiHome /> },
        { to: '/all-events', label: 'All Events', icon: <FiCalendar /> },
      ]
    },
    {
      section: 'Events', items: [
        { to: '/faculty/create-event', label: 'Create Event', icon: <FiPlusCircle /> },
        { to: '/faculty/my-events', label: 'My Events', icon: <FiList /> },
      ]
    },
    {
      section: 'System', items: [
        { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      ]
    },
  ],
  student: [
    {
      section: 'Overview', items: [
        { to: '/home', label: 'Home', icon: <FiHome /> },
        { to: '/all-events', label: 'All Events', icon: <FiCalendar /> },
      ]
    },
    {
      section: 'Events', items: [
        { to: '/student/events', label: 'Eligible Events', icon: <FiCalendar /> },
        { to: '/student/registrations', label: 'My Registrations', icon: <FiCreditCard /> },
      ]
    },
    {
      section: 'System', items: [
        { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      ]
    },
  ],
};

import LogoutModal from '../ui/LogoutModal';

const Sidebar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const location = useLocation();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  if (!user) return null;
  const menus = roleMenus[user.role] || roleMenus.student;

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <button className="sidebar-close-btn" onClick={toggleSidebar}>
          <FiX />
        </button>
        <div className="sidebar-user-centered">
          <div className="sidebar-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="sidebar-user-name-large">{user.name}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((section, si) => (
          <div className="sidebar-section" key={si}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <React.Fragment key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
                
                {/* Mobile Only Logout Option - Automatically placed below Notifications if it is part of System items */}
                {item.label === 'Notifications' && (
                  <div className="mobile-only-logout">
                     <button className="sidebar-link logout-btn-sidebar" onClick={handleLogout}>
                        <span className="icon"><FiLogOut /></span> Logout
                      </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
      </nav>

      <LogoutModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={logout} 
      />
    </aside>
  );
};

export default Sidebar;
