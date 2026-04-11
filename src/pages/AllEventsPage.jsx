import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { FiSearch, FiCalendar, FiClock, FiMapPin, FiUsers, FiImage } from 'react-icons/fi';
import Modal from '../components/ui/Modal';

const AllEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('UPCOMING');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getAll({ status: 'published' });
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.schedule?.startDate);
    const end = new Date(event.schedule?.endDate);
    
    if (end < now) return 'COMPLETED';
    if (start <= now && end >= now) return 'ONGOING';
    return 'UPCOMING';
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.category?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const status = getEventStatus(e);
    if (filter === 'ALL') return true;
    return status === filter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'badge-draft';
      case 'ONGOING': return 'badge-published';
      case 'UPCOMING': return 'badge-pending';
      default: return 'badge-draft';
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div>
      {/* DESKTOP HEADER */}
      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">University Events</h1>
            <p className="page-subtitle">A comprehensive list of all officially approved university events</p>
          </div>
        </div>

        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input 
                placeholder="Search by title or category..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="filter-pills">
              {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED'].map(f => (
                <button 
                  key={f} 
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
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
            <option value="ALL">All Events</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="mobile-feed-content" style={{ paddingTop: '10px' }}>
          {filteredEvents.length === 0 ? (
            <div className="mobile-empty-state">No events found</div>
          ) : (
            filteredEvents.map(event => (
              <div key={event._id} className="mobile-post-card" onClick={() => setSelectedEvent(event)}>
                <div style={{ padding: '4px 0 12px 0' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className={`badge ${getStatusColor(getEventStatus(event))}`}>{getEventStatus(event)}</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>{formatDate(event.schedule?.startDate)}</span>
                   </div>
                   <h3 className="post-title-bold" style={{ fontSize: '1rem', marginBottom: '4px' }}>{event.title}</h3>
                   <div style={{ fontSize: '13px', color: '#444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiMapPin size={12} /> {event.schedule?.venue}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* DESKTOP UI */}
      <div className="desktop-view-only">
        <div className="events-grid">
          {loading ? (
            <div className="loading-spinner" />
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No events found</div>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event._id} className="event-card">
                <div className="event-card-poster">
                  {event.poster ? (
                    <img src={event.poster} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FiCalendar />
                  )}
                </div>
                <div className="event-card-body">
                  <div className="event-card-title">{event.title}</div>
                  <div className="event-card-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </div>
                  <div className="event-card-meta">
                    <FiClock className="icon" />
                    <span>{formatDate(event.schedule?.startDate)} at {formatTime(event.schedule?.startDate)}</span>
                  </div>
                  <div className="event-card-meta">
                    <FiMapPin className="icon" />
                    <span>{event.schedule?.venue || 'Campus Venue'}</span>
                  </div>
                </div>
                <div className="event-card-footer">
                  <span className={`badge ${getStatusColor(getEventStatus(event))}`}>
                    {getEventStatus(event)}
                  </span>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedEvent(event)}>View Details</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Event Details Modal */}
      <Modal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        title="Institutional Event Details"
        large
      >
        {selectedEvent && (
          <div className="event-details-full">
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="event-poster-full">
                {selectedEvent.poster ? (
                  <img src={selectedEvent.poster} alt="Poster" style={{ width: '100%', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} />
                ) : (
                  <div style={{ background: 'var(--color-bg-alt)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                    <FiImage size={48} color="var(--color-text-muted)" />
                  </div>
                )}
                {selectedEvent.images?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
                    {selectedEvent.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Slide ${idx}`} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="event-info-full">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{selectedEvent.title}</h2>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <span className="badge badge-published">{selectedEvent.category || 'General'}</span>
                  <span className={`badge ${getStatusColor(getEventStatus(selectedEvent))}`}>{getEventStatus(selectedEvent)}</span>
                </div>
                
                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Description</h4>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{selectedEvent.description}</p>
                
                <div style={{ background: 'var(--color-bg-alt)', padding: '16px', borderRadius: '12px', display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <FiCalendar size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date & Time</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(selectedEvent.schedule?.startDate)} | {formatTime(selectedEvent.schedule?.startDate)}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <FiMapPin size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Location/Venue</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedEvent.schedule?.venue || 'Campus Main'} ({selectedEvent.schedule?.mode})</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <FiUsers size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Capacity</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedEvent.registration?.type === 'limited' ? `${selectedEvent.registration?.maxSeats} Seats Max` : 'Unlimited Open Admission'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Eligible Schools</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedEvent.eligibility?.schools?.length > 0 ? (
                    selectedEvent.eligibility.schools.map((s, idx) => (
                      <span key={idx} className="chip">{s}</span>
                    ))
                  ) : (
                    <span className="chip">All University Schools</span>
                  )}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Eligible Departments</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedEvent.eligibility?.departments?.length > 0 ? (
                    selectedEvent.eligibility.departments.map((d, idx) => (
                      <span key={idx} className="chip">{d}</span>
                    ))
                  ) : (
                    <span className="chip">Open to All Departments</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ minWidth: '200px' }}
                onClick={() => setSelectedEvent(null)}
              >
                Close Specification
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllEventsPage;
