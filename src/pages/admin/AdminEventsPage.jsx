import React, { useState, useEffect } from 'react';
import { eventAPI } from '../../services/api';
import { FiSearch, FiCheck, FiX, FiEye, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => { fetchEvents(); }, [filter]);

  const fetchEvents = async () => {
    try {
      const params = { limit: 100 };
      if (filter !== 'ALL') {
        const statusMap = {
          'PENDING': 'pending_dean',
          'IN REVIEW': 'pending_registrar',
          'PUBLISHED': 'published',
          'REJECTED': 'rejected'
        };
        if (statusMap[filter]) params.status = statusMap[filter];
      }
      const res = await eventAPI.getAll(params);
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleAdminApprove = async (id) => {
    try {
      await eventAPI.adminApprove(id);
      fetchEvents();
      setSelectedEvent(null);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventAPI.delete(id);
      fetchEvents();
    } catch { /* ignore */ }
  };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-draft', pending_dean: 'badge-pending', pending_registrar: 'badge-pending', approved: 'badge-approved', published: 'badge-published', rejected: 'badge-rejected' };
    const labels = { draft: 'DRAFT', pending_dean: 'PENDING DEAN', pending_registrar: 'PENDING REGISTRAR', approved: 'APPROVED', published: 'PUBLISHED', rejected: 'REJECTED' };
    return <span className={`badge ${map[status]}`}>{labels[status] || status}</span>;
  };

  const filters = ['ALL', 'PENDING', 'IN REVIEW', 'PUBLISHED', 'REJECTED'];
  const filteredEvents = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* DESKTOP HEADER */}
      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">All Events</h1>
            <p className="page-subtitle">Manage all events across the system</p>
          </div>
        </div>

        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-pills">
              {filters.map(f => (
                <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE INTERFACE */}
      <div className="mobile-view-only">
        <div className="mobile-controls-bar">
          <div className="mobile-search-input">
            <FiSearch className="icon" />
            <input 
              type="text" 
              placeholder="Search Events..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="mobile-filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {filters.map(f => (
              <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div className="mobile-feed-content" style={{ paddingTop: '10px' }}>
          {loading ? (
            <div className="loading-spinner" />
          ) : filteredEvents.length === 0 ? (
            <div className="mobile-empty-state">No events found</div>
          ) : (
            filteredEvents.map(event => (
              <div 
                key={event._id} 
                className="mobile-post-card" 
                style={{ padding: '16px' }}
                onClick={() => setSelectedEvent(event)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1A1A1A' }}>{event.title}</div>
                  {getStatusBadge(event.status)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{event.category || 'Institutional'} • {event.createdBy?.name || 'Faculty'}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}><FiEye /> View</button>
                  {!['published', 'rejected'].includes(event.status) && (
                    <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); handleAdminApprove(event._id); }}><FiCheck /> Approve</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="desktop-view-only">
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="loading-spinner" /></td></tr>
              ) : filteredEvents.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No events found</td></tr>
              ) : (
                filteredEvents.map(event => (
                  <tr key={event._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>{event.title?.charAt(0)}</div>
                        <div>
                          <div className="user-cell-name">{event.title}</div>
                          <div className="user-cell-id">{event.category || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{event.createdBy?.name || '—'}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(event.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>{getStatusBadge(event.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon btn-ghost" onClick={() => setSelectedEvent(event)}><FiEye /></button>
                        {!['published', 'rejected'].includes(event.status) && (
                          <button className="btn-icon btn-ghost" style={{ color: 'var(--color-success)' }} onClick={() => handleAdminApprove(event._id)}><FiCheck /></button>
                        )}
                        <button className="btn-icon btn-ghost delete-btn" onClick={() => handleDelete(event._id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details" large>
        {selectedEvent && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>{selectedEvent.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{selectedEvent.description}</p>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Category:</span> {selectedEvent.category || 'General'}</div>
              <div><span className="form-label">Status:</span> {getStatusBadge(selectedEvent.status)}</div>
            </div>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Start Date:</span> {selectedEvent.schedule?.startDate ? new Date(selectedEvent.schedule.startDate).toLocaleDateString() : '—'}</div>
              <div><span className="form-label">End Date:</span> {selectedEvent.schedule?.endDate ? new Date(selectedEvent.schedule.endDate).toLocaleDateString() : '—'}</div>
            </div>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Venue:</span> {selectedEvent.schedule?.venue || '—'}</div>
              <div><span className="form-label">Mode:</span> {selectedEvent.schedule?.mode || '—'}</div>
            </div>
            <div className="form-row">
              <div><span className="form-label">Registration Type:</span> {selectedEvent.registration?.type || '—'}</div>
              <div><span className="form-label">Seats:</span> {selectedEvent.registration?.type === 'limited' ? `${selectedEvent.registration.registeredCount || 0}/${selectedEvent.registration.maxSeats}` : 'Unlimited'}</div>
            </div>
            {selectedEvent.status !== 'published' && selectedEvent.status !== 'rejected' && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-success" onClick={() => handleAdminApprove(selectedEvent._id)}>Approve & Publish</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEventsPage;
