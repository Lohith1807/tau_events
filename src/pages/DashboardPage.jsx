import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { eventAPI, userAPI } from '../services/api';
import { FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiUsers, FiMapPin, FiInfo } from 'react-icons/fi';
import Modal from '../components/ui/Modal';

const DashboardPage = () => {
  const { user } = useAuth();
  const [eventStats, setEventStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [userStats, setUserStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        eventAPI.getStats(),
        eventAPI.getAll({ limit: 5 })
      ]);
      setEventStats(statsRes.data.stats);
      setRecentEvents(eventsRes.data.events || []);

      if (user.role === 'admin') {
        const uRes = await userAPI.getStats();
        setUserStats(uRes.data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'badge-draft',
      pending_dean: 'badge-pending',
      pending_registrar: 'badge-pending',
      approved: 'badge-approved',
      published: 'badge-published',
      rejected: 'badge-rejected'
    };
    const labelMap = {
      draft: 'DRAFT',
      pending_dean: 'PENDING DEAN',
      pending_registrar: 'PENDING REGISTRAR',
      approved: 'APPROVED',
      published: 'PUBLISHED',
      rejected: 'REJECTED'
    };
    return <span className={`badge ${map[status] || ''}`}>{labelMap[status] || status}</span>;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB');
  };

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {user.role === 'admin' ? 'Admin Dashboard' :
               user.role === 'registrar' ? 'Registrar Dashboard' :
               user.role === 'dean' ? 'Dean Dashboard' :
               user.role === 'faculty' ? 'Event Management' :
               'Student Dashboard'}
            </h1>
            <p className="page-subtitle">Welcome back, {user.name}</p>
          </div>
        </div>
      </div>


      {/* MOBILE UI */}
      <div className="mobile-view-only">
        <div className="mobile-feed-content">
          <div className="day-separator">
            <span className="line"></span>
            <span className="day-label">QUICK STATS</span>
            <span className="line"></span>
          </div>
          
          <div className="mobile-stats-row">
            {/* Event Stats */}
            <div className="mobile-stat-square blue">
              <span className="value">{eventStats.total}</span>
              <span className="label">Event</span>
              <span className="sub-label">Total</span>
            </div>
            <div className="mobile-stat-square orange">
              <span className="value">{eventStats.pending}</span>
              <span className="label">Event</span>
              <span className="sub-label">Pending</span>
            </div>
            <div className="mobile-stat-square green">
              <span className="value">{eventStats.approved}</span>
              <span className="label">Event</span>
              <span className="sub-label">Approved</span>
            </div>
            <div className="mobile-stat-square red">
              <span className="value">{eventStats.rejected}</span>
              <span className="label">Event</span>
              <span className="sub-label">Rejected</span>
            </div>


            {/* Admin-only User Stats */}
            {user.role === 'admin' && userStats && (
              <>
                <div className="mobile-stat-square blue">
                  <span className="value">{userStats.totalUsers}</span>
                  <span className="label">Total Users</span>
                </div>
                {Object.entries(userStats.roles || {}).map(([role, count]) => (
                  <div key={role} className="mobile-stat-square green">
                    <span className="value">{count}</span>
                    <span className="label">{role}s</span>
                  </div>
                ))}
              </>
            )}
          </div>


          <div className="day-separator" style={{ marginTop: '24px' }}>
            <span className="line"></span>
            <span className="day-label">RECENT UPDATES</span>
            <span className="line"></span>
          </div>

          {recentEvents.length === 0 ? (
            <div className="mobile-empty-state">No recent activity</div>
          ) : (
            recentEvents.map(event => (
              <div 
                key={event._id} 
                className="mobile-post-card" 
                style={{ padding: '16px' }}
                onClick={() => setSelectedEvent(event)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#1A1A1A' }}>{event.title}</div>
                  {getStatusBadge(event.status)}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  By {event.createdBy?.name || 'Faculty'} • {formatDate(event.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP UI */}
      <div className="desktop-view-only">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><FiFileText /></div>
            <div>
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{eventStats.total}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><FiClock /></div>
            <div>
              <div className="stat-label">Pending Review</div>
              <div className="stat-value">{eventStats.pending}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><FiCheckCircle /></div>
            <div>
              <div className="stat-label">Approved / Published</div>
              <div className="stat-value">{eventStats.approved}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><FiAlertCircle /></div>
            <div>
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{eventStats.rejected}</div>
            </div>
          </div>
        </div>

        {user.role === 'admin' && userStats && (
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-icon blue"><FiUsers /></div>
              <div>
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{userStats.totalUsers}</div>
              </div>
            </div>
            {Object.entries(userStats.roles || {}).map(([role, count]) => (
              <div className="stat-card" key={role}>
                <div className="stat-icon green"><FiUsers /></div>
                <div>
                  <div className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)}s</div>
                  <div className="stat-value">{count}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Events Table */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Events</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Details</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No events found</td></tr>
              ) : (
                recentEvents.map(event => (
                  <tr key={event._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {event.title?.charAt(0)}
                        </div>
                        <div>
                          <div className="user-cell-name">{event.title}</div>
                          <div className="user-cell-id">{event.category || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{event.createdBy?.name || '—'}</td>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>{getStatusBadge(event.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Mobile "Page" */}
      <Modal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        title="Event Specifics"
      >
        {selectedEvent && (
          <div className="event-details-mobile">
            <div className="detail-section" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-primary)' }}>{selectedEvent.title}</h2>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                   <span className="badge badge-published">{selectedEvent.category || 'General'}</span>
                   {getStatusBadge(selectedEvent.status)}
                </div>
                <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6' }}>{selectedEvent.description || 'No description provided for this event.'}</p>
              </div>
            </div>

            <div className="detail-section" style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px' }}>
                <FiCalendar color="var(--color-primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>Scheduled Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedEvent.schedule?.startDate)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px' }}>
                <FiMapPin color="var(--color-primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>Venue / Mode</div>
                  <div style={{ fontWeight: 600 }}>{selectedEvent.schedule?.venue || 'Campus Main'} ({selectedEvent.schedule?.mode || 'Offline'})</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px' }}>
                <FiInfo color="var(--color-primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>Registration Status</div>
                  <div style={{ fontWeight: 600 }}>{selectedEvent.registration?.type === 'limited' ? `Max ${selectedEvent.registration?.maxSeats} Seats` : 'Open Entrance'}</div>
                </div>
              </div>
            </div>
            
            <button className="btn btn-primary btn-block" style={{ marginTop: '30px' }} onClick={() => setSelectedEvent(null)}>
              Return to Dashboard
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
