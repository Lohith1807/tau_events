import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';

import { universityData } from '../../utils/universityData';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
    if (!file) return null;
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

  const fileToBase64 = (file) => compressImage(file);

  const allSchools = Object.keys(universityData);
  const allDepartments = allSchools.reduce((acc, school) => {
    const levels = universityData[school].levels;
    const courses = Object.values(levels).flat();
    return [...new Set([...acc, ...courses])];
  }, []);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    eligibility: { batches: [], schools: [], departments: [] },
    schedule: { startDate: '', endDate: '', venue: '', mode: 'offline' },
    registration: { type: 'unlimited', maxSeats: 100, startDate: '', endDate: '' },
    certificate: { enabled: false, preview: null },
  });

  const [poster, setPoster] = useState(null);
  const [images, setImages] = useState([]);
  const [certPreview, setCertPreview] = useState(null);
  const [tagInputs, setTagInputs] = useState({ batch: '', school: '', dept: '' });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNested = (parent, field, value) => {
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const addTag = (parent, field, tagKey) => {
    const val = tagInputs[tagKey]?.trim();
    if (!val) return;
    setForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: [...(prev[parent][field] || []), val]
      }
    }));
    setTagInputs(prev => ({ ...prev, [tagKey]: '' }));
  };

  const removeTag = (parent, field, index) => {
    setForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: prev[parent][field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async () => {
    setError('');
    
    // Basic validation
    if (!form.title.trim()) return setError('Event title is required.');
    if (!form.description.trim()) return setError('Event description is required.');
    if (!form.schedule.startDate) return setError('Start date and time are required.');
    if (!form.schedule.endDate) return setError('End date and time are required.');
    if (form.eligibility.schools.length === 0) return setError('At least one eligible school must be selected.');

    setLoading(true);
    try {
      // Process all files to Base64
      const [posterBase64, certBase64, imagesBase64] = await Promise.all([
        fileToBase64(poster),
        fileToBase64(certPreview),
        Promise.all(images.map(f => fileToBase64(f)))
      ]);

      const data = {
        ...form,
        poster: posterBase64,
        images: imagesBase64,
        certificate: {
          ...form.certificate,
          preview: certBase64
        }
      };

      const response = await eventAPI.create(data);
      console.log('Event created:', response.data);
      navigate('/faculty/my-events');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['General', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Conference'];


  const renderStep1 = () => (
    <div>
      <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Basic Information</h3>
      <div className="form-group">
        <label className="form-label">Event Title *</label>
        <input className="form-input" placeholder="Enter event title" value={form.title} onChange={e => handleChange('title', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea className="form-textarea" placeholder="Describe the event..." value={form.description} onChange={e => handleChange('description', e.target.value)} rows="5" required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => handleChange('category', e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Event Poster</label>
          <input type="file" className="form-input" accept="image/*" onChange={e => setPoster(e.target.files[0])} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Additional Images</label>
        <input type="file" className="form-input" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))} />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Eligibility Criteria</h3>
      <div className="form-group">
        <label className="form-label">Eligible Batches (leave empty for all)</label>
        <div className="tag-input-container">
          {form.eligibility.batches.map((b, i) => (
            <span className="tag-item" key={i}>{b} <button onClick={() => removeTag('eligibility', 'batches', i)}>×</button></span>
          ))}
          <input
            placeholder="Type batch year and press Enter"
            value={tagInputs.batch}
            onChange={e => setTagInputs(prev => ({ ...prev, batch: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('eligibility', 'batches', 'batch'); } }}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Eligible Schools *</label>
        <div className="tag-input-container">
          {form.eligibility.schools.map((s, i) => (
            <span className="tag-item" key={i}>{s} <button onClick={() => removeTag('eligibility', 'schools', i)}>×</button></span>
          ))}
          <select
            style={{ border: 'none', background: 'transparent', flex: 1, minWidth: '120px', fontSize: '0.875rem' }}
            value=""
            onChange={e => {
              if (e.target.value && !form.eligibility.schools.includes(e.target.value)) {
                setForm(prev => ({ ...prev, eligibility: { ...prev.eligibility, schools: [...prev.eligibility.schools, e.target.value] } }));
              }
            }}
          >
            <option value="">Add school...</option>
            {allSchools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Eligible Departments (Filtered by School)</label>
        <div className="tag-input-container" style={{ background: form.eligibility.schools.length === 0 ? '#f9fafb' : '' }}>
          {form.eligibility.departments.map((d, i) => (
            <span className="tag-item" key={i}>{d} <button onClick={() => removeTag('eligibility', 'departments', i)}>×</button></span>
          ))}
          <select
            style={{ border: 'none', background: 'transparent', flex: 1, minWidth: '120px', fontSize: '0.875rem' }}
            value=""
            disabled={form.eligibility.schools.length === 0}
            onChange={e => {
              if (e.target.value && !form.eligibility.departments.includes(e.target.value)) {
                setForm(prev => ({ ...prev, eligibility: { ...prev.eligibility, departments: [...prev.eligibility.departments, e.target.value] } }));
              }
            }}
          >
            <option value="">{form.eligibility.schools.length === 0 ? 'Select a school first' : 'Add department...'}</option>
            {allSchools
              .filter(s => form.eligibility.schools.includes(s))
              .reduce((acc, school) => {
                const levels = universityData[school].levels;
                const courses = Object.values(levels).flat();
                return [...new Set([...acc, ...courses])];
              }, [])
              .map(d => <option key={d} value={d}>{d}</option>)
            }
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Schedule & Venue</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date & Time *</label>
          <input type="datetime-local" className="form-input" value={form.schedule.startDate} onChange={e => handleNested('schedule', 'startDate', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">End Date & Time *</label>
          <input type="datetime-local" className="form-input" value={form.schedule.endDate} onChange={e => handleNested('schedule', 'endDate', e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Venue</label>
          <input className="form-input" placeholder="e.g. Main Auditorium" value={form.schedule.venue} onChange={e => handleNested('schedule', 'venue', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Mode</label>
          <select className="form-select" value={form.schedule.mode} onChange={e => handleNested('schedule', 'mode', e.target.value)}>
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Registration & Certificates</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Registration Type</label>
          <select className="form-select" value={form.registration.type} onChange={e => handleNested('registration', 'type', e.target.value)}>
            <option value="unlimited">Unlimited Seats</option>
            <option value="limited">Limited Seats (FCFS)</option>
          </select>
        </div>
        {form.registration.type === 'limited' && (
          <div className="form-group">
            <label className="form-label">Maximum Seats</label>
            <input type="number" className="form-input" placeholder="e.g. 100" value={form.registration.maxSeats} onChange={e => handleNested('registration', 'maxSeats', parseInt(e.target.value) || 0)} min="1" />
          </div>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Registration Start</label>
          <input type="datetime-local" className="form-input" value={form.registration.startDate} onChange={e => handleNested('registration', 'startDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Registration End</label>
          <input type="datetime-local" className="form-input" value={form.registration.endDate} onChange={e => handleNested('registration', 'endDate', e.target.value)} />
        </div>
      </div>
      <hr className="divider" />
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Issue Certificate?</label>
          <select className="form-select" value={form.certificate.enabled ? 'yes' : 'no'} onChange={e => handleNested('certificate', 'enabled', e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        {form.certificate.enabled && (
          <div className="form-group">
            <label className="form-label">Certificate Preview</label>
            <input type="file" className="form-input" accept="image/*,.pdf" onChange={e => setCertPreview(e.target.files[0])} />
          </div>
        )}
      </div>
    </div>
  );

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Eligibility' },
    { num: 3, label: 'Schedule' },
    { num: 4, label: 'Registration' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Fill in event details to submit for review</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
        {steps.map(s => (
          <div
            key={s.num}
            onClick={() => setStep(s.num)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: step === s.num ? 'var(--color-primary)' : step > s.num ? 'var(--color-success-bg)' : 'var(--color-bg-input)',
              color: step === s.num ? 'white' : step > s.num ? 'var(--color-success)' : 'var(--color-text-secondary)',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8125rem',
              transition: 'all 200ms ease'
            }}
          >
            Step {s.num}: {s.label}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {error && <div className="form-error" style={{ marginTop: '16px', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            {step > 1 ? (
              <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Previous</button>
            ) : <div />}

            {step < 4 ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Next Step</button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Event for Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
