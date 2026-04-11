import React, { useState, useEffect } from 'react';
import { eventAPI, registrationAPI } from '../../services/api';
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiSearch } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

import confetti from 'canvas-confetti';

const StudentEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmReg, setConfirmReg] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getEligible();
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleRegister = async (eventId) => {
    setRegistering(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await registrationAPI.register(eventId);
      setMessage({ text: res.data.message || 'Registration successful!', type: 'success' });
      fireConfetti();
      fetchEvents();
      setConfirmReg(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Registration failed.', type: 'error' });
      setConfirmReg(null);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  const filteredEvents = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Eligible Events</h1>
          <p className="page-subtitle">Events matching your department, batch, and school</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div className="search-box" style={{ maxWidth: '400px' }}>
          <FiSearch className="search-icon" />
          <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No Eligible Events</div>
          <div className="empty-state-desc">There are no events available for you at the moment. Check back later!</div>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div className="event-card" key={event._id}>
              <div className="event-card-poster">
                {event.poster ? (
                  <img src={event.poster} alt={event.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', fontSize: '3rem', background: 'linear-gradient(135deg, #FFEBEE, #E3F2FD)' }}>
                    📅
                  </div>
                )}
              </div>
              <div className="event-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                  <span className="chip">{event.category || 'General'}</span>
                  <span className="chip" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Open</span>
                </div>
                <div className="event-card-title">{event.title}</div>
                <div className="event-card-desc">{event.description}</div>
                <div className="event-card-meta">
                  <FiCalendar className="icon" /> {formatDate(event.schedule?.startDate)}
                </div>
                <div className="event-card-meta">
                  <FiMapPin className="icon" /> {event.schedule?.venue || 'TBD'}
                </div>
                <div className="event-card-meta">
                  <FiUsers className="icon" /> {event.registration?.type === 'limited' ? `${event.registration.registeredCount || 0}/${event.registration.maxSeats} seats` : 'Unlimited seats'}
                </div>
              </div>
              <div className="event-card-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEvent(event)}>View Details</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setConfirmReg(event)}
                  disabled={registering}
                >
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details" large>
        {selectedEvent && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>{selectedEvent.title}</h3>
            <span className="chip" style={{ marginBottom: '16px', display: 'inline-block' }}>{selectedEvent.category || 'General'}</span>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>{selectedEvent.description}</p>

            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-body" style={{ padding: '16px' }}>
                <div className="form-row" style={{ marginBottom: '12px' }}>
                  <div><span className="form-label">Start:</span> {formatDate(selectedEvent.schedule?.startDate)} at {formatTime(selectedEvent.schedule?.startDate)}</div>
                  <div><span className="form-label">End:</span> {formatDate(selectedEvent.schedule?.endDate)} at {formatTime(selectedEvent.schedule?.endDate)}</div>
                </div>
                <div className="form-row" style={{ marginBottom: '12px' }}>
                  <div><span className="form-label">Venue:</span> {selectedEvent.schedule?.venue || 'TBD'}</div>
                  <div><span className="form-label">Mode:</span> {selectedEvent.schedule?.mode?.charAt(0).toUpperCase() + selectedEvent.schedule?.mode?.slice(1)}</div>
                </div>
                <div className="form-row">
                  <div><span className="form-label">Registration:</span> {selectedEvent.registration?.type === 'limited' ? `Limited (${selectedEvent.registration.registeredCount || 0}/${selectedEvent.registration.maxSeats})` : 'Unlimited'}</div>
                  <div><span className="form-label">Certificate:</span> {selectedEvent.certificate?.enabled ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            <div><span className="form-label">Organized by:</span> {selectedEvent.createdBy?.name} ({selectedEvent.createdBy?.department})</div>

            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => { setConfirmReg(selectedEvent); setSelectedEvent(null); }} disabled={registering}>
                {registering ? 'Registering...' : 'Register for this Event'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Registration Confirmation Modal */}
      <Modal 
        isOpen={!!confirmReg} 
        onClose={() => setConfirmReg(null)} 
        title="Confirm Registration"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setConfirmReg(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => handleRegister(confirmReg._id)} disabled={registering}>
              {registering ? 'Processing...' : 'Yes, Register Me'}
            </button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</div>
          <h3 style={{ marginBottom: '8px' }}>Are you sure?</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            You are registering for <strong>{confirmReg?.title}</strong>. 
            Once confirmed, you can find your ID card in 'My Registrations'.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StudentEventsPage;
