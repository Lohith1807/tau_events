import React from 'react';
import { FiLogOut, FiX } from 'react-icons/fi';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal logout-pop-up" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '380px', padding: '24px', borderRadius: '20px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div className="logout-icon-circle">
            <FiLogOut />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '12px 0 8px', color: 'var(--color-text)' }}>
            Logging Out?
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Are you sure for logging out from this session?<br/>You will need to verify OTP again to login.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px', 
              fontWeight: 600,
              background: '#ef4444',
              color: 'white'
            }}
          >
            Yes, Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
