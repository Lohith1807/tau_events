import React, { useState, useEffect } from 'react';
import { registrationAPI } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { FiDownload, FiX, FiCreditCard } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const StudentRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await registrationAPI.getMy();
      setRegistrations(res.data.registrations || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleViewIdCard = async (reg) => {
    try {
      const res = await registrationAPI.getIdCard(reg._id);
      setIdCard({
        ...res.data.idCard,
        studentAvatar: reg.student?.avatar
      });
      setShowIdCard(true);
    } catch {
      // fallback to registration data
      setIdCard({
        studentName: reg.student?.name || '—',
        rollNo: reg.student?.rollNo || '—',
        school: reg.student?.school || '—',
        department: reg.student?.department || '—',
        eventTitle: reg.event?.title || '—',
        eventDate: reg.event?.schedule?.startDate,
        venue: reg.event?.schedule?.venue,
        registrationId: reg.registrationId,
        qrData: reg.qrData || JSON.stringify({ regId: reg.registrationId }),
        studentAvatar: reg.student?.avatar
      });
      setShowIdCard(true);
    }
  };



  const handlePrintIdCard = () => {
    const printContent = document.getElementById('id-card-print');
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>ID Card</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Inter', Arial, sans-serif; }
        .id-card { border: 2px solid #C62828; border-radius: 12px; overflow: hidden; max-width: 400px; width: 100%; position: relative; }
        .id-card-header { background: #C62828; color: white; padding: 16px 20px; padding-right: 100px; text-align: left; }
        .id-card-header h3 { margin: 0; font-size: 14px; text-transform: uppercase; }
        .id-card-header p { margin: 4px 0 0; font-size: 11px; opacity: 0.9; }
        .id-card-photo { position: absolute; top: 12px; right: 15px; width: 75px; height: 95px; background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #C62828; }
        .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
        .id-card-body { padding: 20px; padding-right: 110px; position: relative; min-height: 160px; }
        .id-card-info { flex: 1; }
        .label { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-weight: 700; font-size: 13px; margin-bottom: 8px; }
        .id-card-qr { position: absolute; bottom: 25px; right: 30px; width: 75px; height: 75px; background: white; }
        .id-card-footer { background: #F9FAFB; padding: 10px 20px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E7EB; }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Registrations</h1>
          <p className="page-subtitle">Your event registrations and ID cards</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <div className="empty-state-title">No Registrations</div>
          <div className="empty-state-desc">You haven't registered for any events yet.</div>
        </div>
      ) : (
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Reg. ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                        {reg.event?.title?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="user-cell-name">{reg.event?.title || 'Unknown Event'}</div>
                        <div className="user-cell-id">{reg.event?.category || 'General'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{formatDate(reg.event?.schedule?.startDate)}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{reg.event?.schedule?.venue || '—'}</td>
                  <td>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                      {reg.registrationId}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${reg.status === 'registered' ? 'badge-approved' : reg.status === 'attended' ? 'badge-published' : 'badge-rejected'}`}>
                      {reg.status?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewIdCard(reg)} title="View ID Card">
                        <FiCreditCard /> ID Card
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ID Card Modal */}
      <Modal isOpen={showIdCard} onClose={() => setShowIdCard(false)} title="Event ID Card"
        footer={
          <button className="btn btn-primary" onClick={handlePrintIdCard}>
            <FiDownload /> Print / Download
          </button>
        }
      >
        {idCard && (
          <div id="id-card-print" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="id-card">
              <div className="id-card-header">
                <h3 style={{ color: 'white', margin: 0 }}>Event Registration ID Card</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.9 }}>{idCard.eventTitle}</p>
                <div className="id-card-photo">
                  {idCard.studentAvatar ? (
                    <img src={idCard.studentAvatar} alt="Passport Size" />
                  ) : (
                    idCard.studentName?.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <div className="id-card-body">
                <div className="id-card-info">
                  <div className="label">Student Name</div>
                  <div className="value">{idCard.studentName}</div>
                  <div className="label">Roll Number</div>
                  <div className="value">{idCard.rollNo}</div>
                  <div className="label">School</div>
                  <div className="value">{idCard.school || idCard.department || '—'}</div>
                  <div className="label">Event Date</div>
                  <div className="value">{formatDate(idCard.eventDate)}</div>
                  <div className="label">Venue</div>
                  <div className="value">{idCard.venue || 'TBD'}</div>
                </div>
                <div className="id-card-qr">
                  <QRCodeSVG
                    value={idCard.qrData || `Reg ID: ${idCard.registrationId}\nName: ${idCard.studentName}\nRoll No: ${idCard.rollNo}\nEvent: ${idCard.eventTitle}`}
                    size={75}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              <div className="id-card-footer">
                Registration ID: <strong>{idCard.registrationId}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentRegistrationsPage;
