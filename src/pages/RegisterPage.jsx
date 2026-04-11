import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { universityData } from '../utils/universityData';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', rollNo: '',
    department: '', school: '', programLevel: '', batch: '', phone: '',
    avatar: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const { register, login } = useAuth();
  const navigate = useNavigate();

  // Reset dependent fields when school changes
  useEffect(() => {
    if (form.school) {
      setForm(prev => ({ ...prev, programLevel: '', department: '' }));
    }
  }, [form.school]);

  // Reset department when programLevel changes
  useEffect(() => {
    if (form.programLevel) {
      setForm(prev => ({ ...prev, department: '' }));
    }
  }, [form.programLevel]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const compressImage = (file, maxWidth = 400, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Allow up to 5MB original, but we will compress
        setError('Image is too large. Please select a smaller one.');
        return;
      }
      const compressed = await compressImage(file);
      setForm(prev => ({ ...prev, avatar: compressed }));
      setPhotoPreview(compressed);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!form.school || !form.programLevel || !form.department) {
      setError('Please select School, Program Level, and Department.');
      return;
    }

    if (!form.avatar) {
      setError('Passport size picture is required.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const [otp, setOtp] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyLogin({ email: form.email, otp });
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your email for the correct code.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/apollo.png" alt="Apollo Logo" />
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
            Account created successfully! Please enter the 4-digit code sent to <strong>{form.email}</strong> to verify your account and proceed to the portal.
          </p>
          <form onSubmit={handleVerify}>
            {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ display: 'block', textAlign: 'center' }}>Enter Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="× × × ×"
                maxLength="4"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem', width: '180px', margin: '0 auto', letterSpacing: '8px', fontWeight: 800 }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'VERIFYING...' : 'VERIFY & PROCEED'}
            </button>
          </form>
          <p style={{ marginTop: '16px', fontSize: '0.875rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Back to Registration</button>
          </p>
        </div>
      </div>
    );
  }

  const schools = Object.keys(universityData);
  const levels = form.school ? Object.keys(universityData[form.school].levels) : [];
  const departments = (form.school && form.programLevel) ? universityData[form.school].levels[form.programLevel] : [];

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-scrollable" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="auth-logo">
          <img src="/apollo.png" alt="Apollo Logo" />
        </div>
        <h1 className="auth-title">Account Registration</h1>

        <form onSubmit={handleSubmit}>
          {/* Photo Upload Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
            <div 
              style={{ 
                width: '80px', 
                height: '95px', 
                border: '2px dashed var(--color-border)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'var(--color-bg-alt)',
                marginBottom: '4px',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('passport-photo').click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '2px' }}>📸</div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>PHOTO</div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id="passport-photo" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <button 
              type="button" 
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px', height: 'auto' }}
              onClick={() => document.getElementById('passport-photo').click()}
            >
              Upload Picture *
            </button>
          </div>
          <div className="form-group">
            <label className="form-label">Full Name (as per Records)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Full name as per records"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              id="register-name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <input
                type="email"
                className="form-input"
                placeholder="regno@apollouniversity.edu.in"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                id="register-email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  id="register-password"
                />
                <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 122411510210"
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Batch Year</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2024"
                name="batch"
                value={form.batch}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select School</label>
            <select className="form-select" name="school" value={form.school} onChange={handleChange} required>
              <option value="">Select School</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Program Level</label>
              <select className="form-select" name="programLevel" value={form.programLevel} onChange={handleChange} disabled={!form.school} required>
                <option value="">Select Level</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department / Course</label>
              <select className="form-select" name="department" value={form.department} onChange={handleChange} disabled={!form.programLevel} required>
                <option value="">Select Course</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="register-btn">
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" className="form-link">Login to Official Portal</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
