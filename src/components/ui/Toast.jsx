import React from 'react';

const Toast = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => onRemove(t.id)}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
