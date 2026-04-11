import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import { FiX, FiCheckCircle, FiBell } from 'react-icons/fi';

const NotificationPanel = ({ onClose, onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll({ limit: 30 });
      setNotifications(res.data.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      onUpdate?.();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onUpdate?.();
    } catch {
      // ignore
    }
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

  return (
    <div className="notification-panel" id="notification-panel">
      <div className="notification-panel-header">
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleMarkAllRead}
            style={{ fontSize: '0.75rem' }}
          >
            <FiCheckCircle /> Mark all read
          </button>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
      </div>

      <div className="notification-panel-body">
        {loading ? (
          <div className="loading-spinner" />
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon"><FiBell /></div>
            <div className="empty-state-title">No notifications</div>
            <div className="empty-state-desc">You're all caught up!</div>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`notification-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleMarkRead(n._id)}
            >
              {!n.isRead && <div className="notification-dot" />}
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
