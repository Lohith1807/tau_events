import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../../services/api';
import { FiSearch, FiEye, FiUsers } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const FacultyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getAll({ limit: 100 });
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleViewRegistrations = async (eventId) => {
    try {
      const res = await registrationAPI.getByEvent(eventId);
      setRegistrations(res.data.registrations || []);
      setShowRegistrations(true);
    } catch { /* ignore */ }
  };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-draft', pending_dean: 'badge-pending', pending_registrar: 'badge-submitted', published: 'badge-published', rejected: 'badge-rejected' };
    const labels = { draft: 'DRAFT', pending_dean: 'WITH DEAN', pending_registrar: 'WITH REGISTRAR', published: 'PUBLISHED', rejected: 'REJECTED' };
    return <span className={`badge ${map[status] || 'badge-draft'}`}>{labels[status] || status}</span>;
  };

  const filters = ['ALL', 'PENDING', 'PUBLISHED', 'REJECTED'];
  const filteredEvents = events.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'PENDING') return ['pending_dean', 'pending_registrar'].includes(e.status);
    if (filter === 'PUBLISHED') return e.status === 'published';
    if (filter === 'REJECTED') return e.status === 'rejected';
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">Track your submitted events and their approval status</p>
        </div>
        <Link to="/faculty/create-event" className="btn btn-primary">+ Create New Event</Link>
      </div>

      <div className="data-card">
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Details</th>
              <th>Category</th>
              <th>Submitted</th>
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
                      <div className="user-cell-avatar" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>{event.title?.charAt(0)}</div>
                      <div>
                        <div className="user-cell-name">{event.title}</div>
                        <div className="user-cell-id">{event.schedule?.venue || 'TBD'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{event.category || 'General'}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{new Date(event.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-icon btn-ghost" title="View" onClick={() => setSelectedEvent(event)}><FiEye /></button>
                      {event.status === 'published' && (
                        <button className="btn-icon btn-ghost" title="Registrations" onClick={() => handleViewRegistrations(event._id)}>
                          <FiUsers />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Event Details Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details" large>
        {selectedEvent && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>{selectedEvent.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{selectedEvent.description}</p>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Category:</span> {selectedEvent.category}</div>
              <div><span className="form-label">Status:</span> {getStatusBadge(selectedEvent.status)}</div>
            </div>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Start:</span> {selectedEvent.schedule?.startDate ? new Date(selectedEvent.schedule.startDate).toLocaleString() : '—'}</div>
              <div><span className="form-label">End:</span> {selectedEvent.schedule?.endDate ? new Date(selectedEvent.schedule.endDate).toLocaleString() : '—'}</div>
            </div>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Venue:</span> {selectedEvent.schedule?.venue || '—'}</div>
              <div><span className="form-label">Mode:</span> {selectedEvent.schedule?.mode || '—'}</div>
            </div>
            <div className="form-row">
              <div><span className="form-label">Registration:</span> {selectedEvent.registration?.type === 'limited' ? `Limited (${selectedEvent.registration.registeredCount || 0}/${selectedEvent.registration.maxSeats})` : 'Unlimited'}</div>
              <div><span className="form-label">Certificate:</span> {selectedEvent.certificate?.enabled ? 'Yes' : 'No'}</div>
            </div>
            {selectedEvent.rejectionReason && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <strong>Rejection Reason:</strong> {selectedEvent.rejectionReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Registrations Modal */}
      <Modal isOpen={showRegistrations} onClose={() => setShowRegistrations(false)} title="Registered Students" large>
        {registrations.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>No registrations yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Department</th>
                <th>Reg. ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r._id}>
                  <td>{r.student?.name}</td>
                  <td>{r.student?.rollNo || '—'}</td>
                  <td>{r.student?.department || '—'}</td>
                  <td><span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>{r.registrationId}</span></td>
                  <td><span className={`badge ${r.status === 'attended' ? 'badge-approved' : r.status === 'cancelled' ? 'badge-rejected' : 'badge-submitted'}`}>{r.status?.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
};

export default FacultyEventsPage;
