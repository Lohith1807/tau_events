import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import { FiSearch, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', school: '', rollNo: '' });

  useEffect(() => { fetchUsers(); }, [search, filter]);

  const fetchUsers = async () => {
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (filter !== 'ALL') params.role = filter.toLowerCase();
      const res = await userAPI.getAll(params);
      setUsers(res.data.users || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleEditClick = (user) => {
    setEditUser(user);
    setEditForm({ 
      name: user.name || '', 
      email: user.email || '', 
      role: user.role || '',
      school: user.school || '',
      rollNo: user.rollNo || ''
    });
  };

  const handleUserUpdate = async () => {
    if (!editUser || !editForm.name || !editForm.email || !editForm.role) return;
    try {
      await userAPI.adminUpdateUser(editUser._id, editForm);
      setEditUser(null);
      fetchUsers();
    } catch { /* ignore */ }
  };

  const handleToggleStatus = async (id) => {
    try {
      await userAPI.toggleStatus(id);
      fetchUsers();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAPI.deleteUser(id);
      fetchUsers();
    } catch { /* ignore */ }
  };

  const filters = ['ALL', 'ADMIN', 'REGISTRAR', 'DEAN', 'FACULTY', 'STUDENT'];

  return (
    <div>
      {/* DESKTOP HEADER & CONTROLS */}

      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage all system users and roles</p>
          </div>
        </div>

        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-pills">
              {filters.map(f => (
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
              placeholder="Search Users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="mobile-filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {filters.map(f => (
              <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div className="mobile-feed-content" style={{ paddingTop: '10px' }}>
          {loading ? (
            <div className="loading-spinner" />
          ) : users.length === 0 ? (
            <div className="mobile-empty-state">No users found</div>
          ) : (
            users.map(u => (
              <div 
                key={u._id} 
                className="mobile-post-card" 
                style={{ padding: '12px' }}
                onClick={() => handleEditClick(u)}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="user-cell-avatar">{u.name?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{u.school || 'Unassigned'}</div>
                  </div>
                  <FiEdit2 size={16} color="#E53935" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* DESKTOP USERS TABLE */}
      <div className="desktop-view-only">
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>School</th>
                <th>Status</th>
                <th style={{ width: '180px' }}>
                  Actions
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '4px', letterSpacing: '0.05em', fontWeight: '500' }}>
                    EDIT · STATUS · REMOVE
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><div className="loading-spinner" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">{u.name?.charAt(0)}</div>
                        <div>
                          <div className="user-cell-name">{u.name}</div>
                          {u.rollNo && <div className="user-cell-id">ID: {u.rollNo}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{u.email}</td>
                    <td>
                      <span className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => handleEditClick(u)}>
                        {u.role?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{u.school || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-icon btn-ghost" title="Edit Profile" onClick={() => handleEditClick(u)} style={{ color: 'var(--color-primary)' }}>
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon btn-ghost" title="Deactivate/Activate" onClick={() => handleToggleStatus(u._id)} style={{ color: u.isActive ? '#E63946' : '#059669' }}>
                          {u.isActive ? <FiUserX /> : <FiUserCheck />}
                        </button>
                        <button className="btn-icon btn-ghost" title="Delete Permanent" onClick={() => handleDelete(u._id)} style={{ color: '#DC2626' }}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User Administrative Profile"
        className="modal-sm"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUserUpdate}>Save Changes</button>
          </div>
        }
      >
        {editUser && (
          <div className="form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.name} 
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">System Role</label>
              <select 
                className="form-select" 
                value={editForm.role} 
                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="dean">Dean</option>
                <option value="registrar">Registrar</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Roll No / ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.rollNo} 
                onChange={e => setEditForm({ ...editForm, rollNo: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={editForm.email} 
                onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">School / Department</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.school} 
                onChange={e => setEditForm({ ...editForm, school: e.target.value })} 
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
