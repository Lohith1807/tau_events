import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postAPI, eventAPI } from '../services/api';
import { FiThumbsUp, FiMessageCircle, FiShare2, FiSend, FiPlus, FiCalendar, FiHeart, FiBookOpen, FiCheckCircle, FiPlusCircle, FiMenu, FiSearch, FiMaximize, FiBell, FiChevronDown, FiFileText, FiDownload, FiChevronRight } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import { toast } from 'react-hot-toast';

const compressImage = (file, maxWidth = 800, quality = 0.7) => {
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

const FeedPage = () => {
  const { user } = useAuth();
  const { toggleSidebar, searchQuery } = useOutletContext() || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', description: '' });
  const [postImages, setPostImages] = useState([]);
  const [creating, setCreating] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [events, setEvents] = useState([]);
  const [filterSaved, setFilterSaved] = useState(false);
  const [filterMy, setFilterMy] = useState(false);
  const [allPastVisible, setAllPastVisible] = useState(false);
  const [allTodayVisible, setAllTodayVisible] = useState(false);
  const [allUpcomingVisible, setAllUpcomingVisible] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Registrar approved events are status 'published' in this system
      const res = await eventAPI.getAll({ status: 'published' });
      setEvents(res.data.events || []);
    } catch { /* ignore */ }
  };

  const fetchPosts = async () => {
    try {
      const res = await postAPI.getAll();
      setPosts(res.data.posts || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      let base64Images = [];
      if (postImages.length > 0) {
        base64Images = await Promise.all(postImages.map(file => fileToBase64(file)));
      }
      
      const data = { 
        title: newPost.title, 
        description: newPost.description, 
        images: base64Images 
      };
      
      await postAPI.create(data);
      toast.success('Post published successfully!');
      setShowCreate(false);
      setNewPost({ title: '', description: '' });
      setPostImages([]);
      fetchPosts();
    } catch {
      toast.error('Failed to publish post');
    }
    finally { setCreating(false); }
  };

  const handleUpvote = async (postId) => {
    try {
      const res = await postAPI.upvote(postId);
      setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
      toast.success('Action recorded');
    } catch {
      toast.error('Failed to update vote');
    }
  };

  const handleComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      const res = await postAPI.comment(postId, text);
      setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      toast.success('Review added');
    } catch {
      toast.error('Failed to add review');
    }
  };

  const handleShare = async (postId) => {
    try {
      await postAPI.share(postId);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p));
      toast.success('Post shared');
    } catch {
      toast.error('Sharing failed');
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;

  return (
    <div className="feed-page-wrapper">
      {/* MOBILE CONTENT ONLY */}
      <div className="mobile-view-only">
        <div className="mobile-feed-content">
          {(searchQuery ? posts.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase())) : posts).length === 0 ? (
            <div className="mobile-empty-state">{searchQuery ? 'No results matching your search' : 'No updates yet'}</div>
          ) : (
            (searchQuery ? posts.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase())) : posts).map(post => (

              <div className="mobile-post-card" key={post._id}>
                <div className="post-card-header">
                  <div className="header-avatar">
                    <div className="orange-icon">📖</div>
                  </div>
                  <div className="header-info">
                    <div className="uni-name">The Apollo University</div>
                    <div className="post-meta">{new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                  </div>
                  <div className="header-actions">
                    <FiChevronDown />
                  </div>
                </div>

                <div className="post-card-body">
                  <h3 className="post-title-bold">{post.title || 'Notification'}</h3>
                  <div className="post-desc-text">
                    {post.description}
                  </div>

                  {post.images?.length > 0 && (
                    <div className="mobile-post-images">
                      {post.images.map((img, i) => (
                        <img 
                          key={i} 
                          src={img.startsWith('data:') ? img : img} 
                          alt="post" 
                          className="mobile-img" 
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="post-card-footer">
                  <div className="post-author-line">
                    Posted by <span className="author-name">{post.author?.name || 'Dr. S Rajasekhar'}</span>
                  </div>
                  <div className="footer-divider"></div>
                  <div className="post-interactions">
                    <div className="interaction-btn" onClick={() => handleUpvote(post._id)}>
                      <FiThumbsUp className={`upvote-icon ${post.upvotes?.includes(user._id) ? 'active' : ''}`} />
                      <span>{post.upvotes?.includes(user._id) ? 'Liked' : 'Like'}</span>
                    </div>
                    <div className="interaction-btn" onClick={() => setCommentTexts({ ...commentTexts, [post._id]: '' })}>
                      <FiMessageCircle />
                      <span>Review</span>
                    </div>
                    <div className="interaction-btn" onClick={() => handleShare(post._id)}>
                      <FiShare2 />
                      <span>Share</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="mobile-floating-btn" onClick={() => setShowCreate(true)}>
          <FiPlus />
        </button>
      </div>

      {/* DESKTOP UI */}
      <div className="desktop-view-only home-page-container">
      <div className="home-sections-cards-grid">
        {/* LEFT COLUMN: PAST EVENTS */}
        <aside className="home-column">
          <div className="home-data-section-card">
            <div className="section-card-header">
              <div className="title">Past Events <FiCalendar className="icon" /></div>
              <span className="view-all-red" onClick={() => setAllPastVisible(!allPastVisible)}>
                {allPastVisible ? 'Show Less' : 'View All'}
              </span>
            </div>

            <div className={`sidebar-list-compact ${!allPastVisible ? 'stacked-view' : ''}`}>
              {events
                .filter(e => e.schedule && new Date(e.schedule.endDate) < new Date())
                .sort((a, b) => new Date(b.schedule.startDate) - new Date(a.schedule.startDate)).length === 0 ? (
                <div className="empty-card-state">No past history recorded</div>
              ) : (
                events
                  .filter(e => e.schedule && new Date(e.schedule.endDate) < new Date())
                  .sort((a, b) => new Date(b.schedule.startDate) - new Date(a.schedule.startDate))
                  .slice(0, allPastVisible ? undefined : 1).map(e => (
                  <div key={e._id} className="past-event-mini-box">
                    <div className="past-main-title">{e.title}</div>
                    <div className="past-mini-grid">
                      <div className="past-field">
                        <span className="label">Event Date :</span>
                        <span className="value">{formatDate(e.schedule.startDate)}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Event Type :</span>
                        <span className="value">{e.category || 'Institutional'}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Conducted by :</span>
                        <span className="value">{e.createdBy?.name || 'Faculty'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!allPastVisible && events.filter(e => e.schedule && new Date(e.schedule.endDate) < new Date()).length > 1 && (
                <>
                  <div className="stack-layer layer-1"></div>
                  <div className="stack-layer layer-2"></div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: NEWS FEED */}
        <main className="home-column main-feed-column">
          <div className="combined-hub-actions">
            {['admin', 'faculty', 'dean', 'registrar'].includes(user.role) && (
              <button className="hub-post-shortcut" onClick={() => setShowCreate(true)}>
                <FiPlus className="icon" /> Post
              </button>
            )}
            <div className="hub-divider-v"></div>
            <div className="hub-filter-bar">
              <span className="filter-label">Show only</span>
              <label className="checkbox-wrap">
                <input type="checkbox" checked={filterSaved} onChange={e => setFilterSaved(e.target.checked)} />
                <span className="check-label">Saved Posts</span>
              </label>
              <label className="checkbox-wrap">
                <input type="checkbox" checked={filterMy} onChange={e => setFilterMy(e.target.checked)} />
                <span className="check-label">My Posts</span>
              </label>
            </div>
          </div>

          <div className="hub-feed-container">
            {posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📰</div>
                <div className="empty-state-title">No Posts Yet</div>
                <div className="empty-state-desc">Be the first to share an update!</div>
              </div>
            ) : (
              posts.map(post => (
                <article className="hub-post-card" key={post._id}>
                  <header className="hub-post-header">
                    <div className="university-logo-wrap">
                      <div className="orange-book-logo">📖</div>
                    </div>
                    <div className="header-text-hub">
                      <div className="university-name">The Apollo University</div>
                      <div className="post-date">{new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    <div className="header-options">
                      <FiPlus style={{ transform: 'rotate(45deg)', fontSize: '1rem' }} />
                    </div>
                  </header>

                  <div className="hub-post-body">
                    <div className="post-description">{post.description}</div>
                  </div>

                  {post.images?.length > 0 && (
                    <div className={`hub-post-media grid-${Math.min(post.images.length, 4)}`}>
                      {post.images.slice(0, 4).map((img, i) => (
                        <img 
                          key={i} 
                          src={img.startsWith('data:') ? img : img} 
                          alt={`Post ${i}`} 
                          className={`post-img-${i}`} 
                        />
                      ))}
                    </div>
                  )}

                  <footer className="hub-post-footer">
                    <div className="footer-info">
                      <span className="posted-by">
                        Posted by <a href={`/profile/${post.author?._id || '#'}`} className="author-link">
                          {post.author?.name}
                        </a>
                      </span>
                      <span className="engage-count">
                        {post.upvotes?.length || 0} <span className="delta-icon">△</span>
                      </span>
                    </div>
                    <div className="engage-bar-hub">
                      <button className="engage-btn" onClick={() => handleUpvote(post._id)}>
                        <FiThumbsUp className="icon" /> Like
                      </button>
                      <button className="engage-btn">
                        <FiMessageCircle className="icon" /> Review
                      </button>
                      <button className="engage-btn" onClick={() => handleShare(post._id)}>
                        <FiShare2 className="icon" /> Share
                      </button>
                    </div>
                  </footer>
                </article>
              ))
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: UPCOMING EVENTS */}
        <aside className="home-column">
          <div className="home-data-section-card">
            {/* TODAY SECTION */}
            <div className="day-separator">
              <span className="line"></span>
              <span className="day-label">TODAY</span>
              <span className="line"></span>
            </div>

            <div className="events-sub-header">
              <span className="sub-title">Events <FiCalendar className="icon-mini" /></span>
              <span className="view-all-red" onClick={() => setAllTodayVisible(!allTodayVisible)}>
                {allTodayVisible ? 'Show Less' : 'View All'}
              </span>
            </div>

            <div className={`sidebar-list-compact ${!allTodayVisible ? 'stacked-view' : ''}`}>
              {events
                .filter(e => e.schedule && new Date(e.schedule.startDate).toDateString() === new Date().toDateString())
                .sort((a, b) => new Date(a.schedule.startDate) - new Date(b.schedule.startDate)).length === 0 ? (
                <div className="empty-card-state">No events for today</div>
              ) : (
                events.filter(e => e.schedule && new Date(e.schedule.startDate).toDateString() === new Date().toDateString())
                  .sort((a, b) => new Date(a.schedule.startDate) - new Date(b.schedule.startDate))
                  .slice(0, allTodayVisible ? undefined : 1).map(e => (
                  <div key={e._id} className="past-event-mini-box">
                    <div className="upcoming-main-title">{e.title}</div>
                    <div className="past-mini-grid">
                      <div className="past-field">
                        <span className="label">Time :</span>
                        <span className="value">{new Date(e.schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.schedule.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Type :</span>
                        <span className="value">{e.category || 'Lecture'}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Faculty :</span>
                        <span className="value">{e.createdBy?.name || 'Dr. Syed Fazuruddin'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!allTodayVisible && events.filter(e => e.schedule && new Date(e.schedule.startDate).toDateString() === new Date().toDateString()).length > 1 && (
                <>
                  <div className="stack-layer layer-1"></div>
                  <div className="stack-layer layer-2"></div>
                </>
              )}
            </div>

            {/* UPCOMING SECTION */}
            <div className="day-separator" style={{ marginTop: 'var(--space-8)' }}>
              <span className="line"></span>
              <span className="day-label">UPCOMING</span>
              <span className="line"></span>
            </div>

            <div className="events-sub-header">
              <span className="sub-title">Events <FiCalendar className="icon-mini" /></span>
              <span className="view-all-red" onClick={() => setAllUpcomingVisible(!allUpcomingVisible)}>
                {allUpcomingVisible ? 'Show Less' : 'View All'}
              </span>
            </div>

            <div className={`sidebar-list-compact ${!allUpcomingVisible ? 'stacked-view' : ''}`}>
              {events
                .filter(e => e.schedule && new Date(e.schedule.startDate) > new Date() && new Date(e.schedule.startDate).toDateString() !== new Date().toDateString())
                .sort((a, b) => new Date(a.schedule.startDate) - new Date(b.schedule.startDate))
                .length === 0 ? (
                <div className="empty-card-state">No upcoming events</div>
              ) : (
                events
                  .filter(e => e.schedule && new Date(e.schedule.startDate) > new Date() && new Date(e.schedule.startDate).toDateString() !== new Date().toDateString())
                  .sort((a, b) => new Date(a.schedule.startDate) - new Date(b.schedule.startDate))
                  .slice(0, allUpcomingVisible ? undefined : 1).map(e => (
                  <div key={e._id} className="past-event-mini-box">
                    <div className="upcoming-main-title">{e.title}</div>
                    <div className="past-mini-grid">
                      <div className="past-field">
                        <span className="label">Date :</span>
                        <span className="value">{formatDate(e.schedule.startDate)}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Time :</span>
                        <span className="value">{new Date(e.schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Type :</span>
                        <span className="value">{e.category || 'Institutional'}</span>
                      </div>
                      <div className="past-field">
                        <span className="label">Faculty :</span>
                        <span className="value">{e.createdBy?.name || 'Faculty'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!allUpcomingVisible && events.filter(e => e.schedule && new Date(e.schedule.startDate) > new Date() && new Date(e.schedule.startDate).toDateString() !== new Date().toDateString()).length > 1 && (
                <>
                  <div className="stack-layer layer-1"></div>
                  <div className="stack-layer layer-2"></div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>

    <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Post">

        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Post title"
              value={newPost.title}
              onChange={e => setNewPost({ ...newPost, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Write your post content..."
              value={newPost.description}
              onChange={e => setNewPost({ ...newPost, description: e.target.value })}
              required
              rows="5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Images (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setPostImages(Array.from(e.target.files))}
              className="form-input"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Posting...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default FeedPage;
