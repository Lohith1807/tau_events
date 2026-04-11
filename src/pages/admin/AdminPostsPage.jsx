import React, { useState, useEffect } from 'react';
import { postAPI } from '../../services/api';
import { FiSearch, FiTrash2, FiEye } from 'react-icons/fi';

const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await postAPI.getAll({ limit: 100 });
      setPosts(res.data.posts || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postAPI.delete(id);
      fetchPosts();
    } catch { /* ignore */ }
  };

  const filtered = posts.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* DESKTOP HEADER */}
      <div className="desktop-view-only">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Posts</h1>
            <p className="page-subtitle">View and moderate all news feed posts</p>
          </div>
        </div>

        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-muted text-small">{filtered.length} posts</span>
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
              placeholder="Search Posts..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{filtered.length}</div>
        </div>

        <div className="mobile-feed-content" style={{ paddingTop: '10px' }}>
          {loading ? (
            <div className="loading-spinner" />
          ) : filtered.length === 0 ? (
            <div className="mobile-empty-state">No posts found</div>
          ) : (
            filtered.map(post => (
              <div 
                key={post._id} 
                className="mobile-post-card" 
                style={{ padding: '16px' }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="user-cell-avatar" style={{ background: '#FFF3E0', color: '#F57C00' }}>{post.title?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1A1A1A' }}>{post.title || 'Notification'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>By {post.author?.name || 'Admin'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '8px', lineHeight: '1.4' }}>{post.description?.substring(0, 100)}...</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                       <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                       <button className="btn btn-ghost btn-sm" style={{ color: '#E53935' }} onClick={() => handleDelete(post._id)}><FiTrash2 /> Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="desktop-view-only">
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Author</th>
                <th>Upvotes</th>
                <th>Comments</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><div className="loading-spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No posts found</td></tr>
              ) : (
                filtered.map(post => (
                  <tr key={post._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>{post.title?.charAt(0)}</div>
                        <div>
                          <div className="user-cell-name">{post.title}</div>
                          <div className="user-cell-id" style={{ color: 'var(--color-text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {post.description?.substring(0, 60)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{post.author?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{post.upvotes?.length || 0}</td>
                    <td style={{ fontWeight: 600 }}>{post.comments?.length || 0}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(post.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button className="btn-icon btn-ghost delete-btn" onClick={() => handleDelete(post._id)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPostsPage;
