import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP
  const { login, verifyLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (step === 1) {
        await login(email, password);
        setStep(2);
      } else {
        await verifyLogin({ email, otp });
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/event.png" alt="Event Logo" />
        </div>
        <h1 className="auth-title">TAU-Event Management</h1>

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <input
                type="email"
                className="form-input"
                placeholder="regno@apollouniversity.edu.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  id="login-password"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.75rem' }}>
              <label className="form-checkbox" style={{ gap: '6px', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember Me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>Forgot Credentials?</Link>
            </div>

            {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              id="login-btn"
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
              Credentials verified! Please enter the 4-digit code sent to <strong>{email}</strong>.
            </p>
            
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="× × × ×"
                maxLength="4"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 800 }}
              />
            </div>

            {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'VERIFYING...' : 'VERIFY & ACCESS'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-ghost btn-block" 
              style={{ marginTop: '12px' }}
              onClick={() => setStep(1)}
            >
              Back to Login
            </button>
          </form>
        )}

        <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Don't Have account?{' '}
          <Link to="/register" className="form-link">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
