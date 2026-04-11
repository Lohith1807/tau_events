import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { notificationAPI } from '../../services/api';
import { FiBell, FiLogOut, FiMenu } from 'react-icons/fi';
import NotificationPanel from '../ui/NotificationPanel';

import LogoutModal from '../ui/LogoutModal';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getAll({ unreadOnly: 'true' });
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  if (!user) return null;

  return (
    <>
      <header className="navbar" id="navbar">
        <div className="navbar-left">
          <button className="navbar-menu-btn" onClick={toggleSidebar}>
            <FiMenu />
          </button>
        </div>

        <div className="navbar-brand">
          <h1 className="navbar-title">TAU - EVENT MANAGEMENT</h1>
        </div>

        <div className="navbar-actions">
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user.name?.toUpperCase()}</div>
              <div className="navbar-user-role-colored">{user.role?.toUpperCase()}</div>
            </div>
          </div>

          <button
            className="navbar-notification-btn-dark"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <button className="navbar-btn-logout" onClick={handleLogout} id="logout-btn">
            <FiLogOut /> LOGOUT
          </button>
        </div>
      </header>

      {showNotifications && (
        <NotificationPanel
          onClose={() => setShowNotifications(false)}
          onUpdate={() => {
            notificationAPI.getAll({ unreadOnly: 'true' })
              .then(res => setUnreadCount(res.data.unreadCount || 0))
              .catch(() => {});
          }}
        />
      )}

      <LogoutModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={logout} 
      />
    </>
  );
};

export default Navbar;
