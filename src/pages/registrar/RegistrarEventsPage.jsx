import React, { useState, useEffect } from 'react';
import { eventAPI } from '../../services/api';
import { FiSearch, FiCheck, FiX, FiEye } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const RegistrarEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getAll({ limit: 100 });
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await eventAPI.approve(id);
      fetchEvents();
      setSelectedEvent(null);
    } catch { /* ignore */ }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      await eventAPI.reject(showReject, rejectReason);
      setShowReject(null);
      setRejectReason('');
      fetchEvents();
    } catch { /* ignore */ }
  };

  const getStatusBadge = (status) => {
    const map = { pending_registrar: 'badge-pending', published: 'badge-published', rejected: 'badge-rejected', pending_dean: 'badge-draft' };
    const labels = { pending_registrar: 'AWAITING APPROVAL', published: 'APPROVED', rejected: 'REJECTED', pending_dean: 'WITH DEAN' };
    return <span className={`badge ${map[status] || 'badge-draft'}`}>{labels[status] || status?.toUpperCase()}</span>;
  };

  const filteredEvents = events.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Only show events strictly awaiting Registrar approval
    return e.status === 'pending_registrar';
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Approvals</h1>
          <p className="page-subtitle">Approve or reject events forwarded by Dean</p>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input placeholder="Search awaiting approvals..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Details</th>
              <th>Faculty</th>
              <th>Dean Review</th>
              <th>Status</th>
              <th>Action</th>
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
                      <div className="user-cell-avatar" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>{event.title?.charAt(0)}</div>
                      <div>
                        <div className="user-cell-name">{event.title}</div>
                        <div className="user-cell-id">{event.category || 'General'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{event.createdBy?.name || '—'}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{event.reviewedByDean?.name || '—'}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td>
                    {event.status === 'pending_registrar' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(event._id)}>
                          <FiCheck /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setShowReject(event._id)}>
                          <FiX /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="review-link" onClick={() => setSelectedEvent(event)}>View Details ↗</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details" large>
        {selectedEvent && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>{selectedEvent.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{selectedEvent.description}</p>
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div><span className="form-label">Start:</span> {selectedEvent.schedule?.startDate ? new Date(selectedEvent.schedule.startDate).toLocaleString() : '—'}</div>
              <div><span className="form-label">End:</span> {selectedEvent.schedule?.endDate ? new Date(selectedEvent.schedule.endDate).toLocaleString() : '—'}</div>
            </div>
            <div className="form-row">
              <div><span className="form-label">Venue:</span> {selectedEvent.schedule?.venue || '—'}</div>
              <div><span className="form-label">Registration:</span> {selectedEvent.registration?.type === 'limited' ? `Limited (${selectedEvent.registration.maxSeats} seats)` : 'Unlimited'}</div>
            </div>
            {selectedEvent.rejectionReason && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <strong>Rejection Reason:</strong> {selectedEvent.rejectionReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!showReject} onClose={() => { setShowReject(null); setRejectReason(''); }} title="Reject Event"
        footer={<><button className="btn btn-secondary" onClick={() => { setShowReject(null); setRejectReason(''); }}>Cancel</button><button className="btn btn-danger" onClick={handleReject}>Confirm Rejection</button></>}>
        <div className="form-group">
          <label className="form-label">Reason for Rejection</label>
          <textarea className="form-textarea" placeholder="Provide a reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows="4" />
        </div>
      </Modal>
    </div>
  );
};

export default RegistrarEventsPage;
