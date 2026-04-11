import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
      setSuccess('Password reset successful! You can now login.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">E</div>
        <h1 className="auth-title">
          {step === 1 ? 'Forgot Credentials?' : step === 2 ? 'Reset Password' : 'Success!'}
        </h1>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
              Enter your registered email to receive a reset OTP.
            </p>
            <div className="form-group">
              <label className="form-label">Official Email ID</label>
              <input type="email" className="form-input" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'SENDING...' : 'SEND RESET OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            {devOtp && (
              <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '16px', fontSize: '0.875rem' }}>
                Dev OTP: {devOtp}
              </p>
            )}
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input type="text" className="form-input" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div>
            <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '24px' }}>{success}</p>
            <Link to="/login" className="btn btn-primary btn-block btn-lg">BACK TO LOGIN</Link>
          </div>
        )}

        <p style={{ marginTop: '24px', fontSize: '0.875rem' }}>
          <Link to="/login" className="form-link">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
