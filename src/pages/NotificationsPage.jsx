import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      setNotifications(res.data.notifications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* ignore */ }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getTypeIcon = (type) => {
    const icons = {
      approval_status: '✅',
      registration_open: '📬',
      registration_close: '🔒',
      reminder: '⏰',
      role_change: '🔄',
      event_update: '📝',
      general: '📢'
    };
    return icons[type] || '📢';
  };

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              {notifications.filter(n => !n.isRead).length} unread notifications
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <FiCheckCircle /> Mark All Read
          </button>
        </div>
      </div>


      {/* MOBILE UI */}
      <div className="mobile-view-only">
        <div className="mobile-feed-content">
          <div className="day-separator">
            <span className="line"></span>
            <span className="day-label">NOTIFICATIONS</span>
            <span className="line"></span>
          </div>
          {notifications.length === 0 ? (
            <div className="mobile-empty-state">You're all caught up!</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                className="mobile-post-card"
                style={{ background: n.isRead ? '#FFFFFF' : '#FFF5F5', borderLeft: n.isRead ? 'none' : '4px solid #E53935' }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ fontSize: '1.2rem' }}>{getTypeIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '3px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '6px' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {!n.isRead && <FiCheck size={16} onClick={() => handleMarkRead(n._id)} />}
                    <FiTrash2 size={16} color="#E53935" onClick={() => handleDelete(n._id)} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP UI */}
      <div className="desktop-view-only">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiBell /></div>
            <div className="empty-state-title">No Notifications</div>
            <div className="empty-state-desc">You're all caught up!</div>
          </div>
        ) : (
          <div className="card">
            {notifications.map(n => (
              <div
                key={n._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--color-border-light)',
                  background: n.isRead ? 'transparent' : 'var(--color-primary-bg)',
                  transition: 'background 200ms ease'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginTop: '2px' }}>{getTypeIcon(n.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px' }}>{n.title}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5' }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>{timeAgo(n.createdAt)}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {!n.isRead && (
                    <button className="btn-icon btn-ghost" onClick={() => handleMarkRead(n._id)} title="Mark as read">
                      <FiCheck />
                    </button>
                  )}
                  <button className="btn-icon btn-ghost delete-btn" onClick={() => handleDelete(n._id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
