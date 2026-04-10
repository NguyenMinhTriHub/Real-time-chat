import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ============================================================
// CSS: GIAO DIỆN KÍNH MỜ (MODERN GLASSMORPHISM)
// ============================================================
const styles = {
  appWrapper: {
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 50%, #ffe4e6 100%)',
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: '#1f293a',
    padding: '30px 0',
    position: 'relative',
  },
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
    padding: '30px',
    marginBottom: '25px',
    textAlign: 'left',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  profileHeader: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '60px',
    marginBottom: '25px',
  },
  profileCover: {
    position: 'absolute',
    top: '-30px',
    left: '-30px',
    right: '-30px',
    height: '140px',
    backgroundImage: 'linear-gradient(45deg, #a78bfa, #818cf8, #fb7185)', 
    borderRadius: '16px 16px 0 0',
  },
  avatarWrapperClickable: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '15px',
    cursor: 'pointer',
    borderRadius: '50%',
  },
  avatarImg: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '6px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '22px',
    height: '22px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    border: '4px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  avatarPopoverMenu: {
    position: 'absolute',
    bottom: '-125px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    zIndex: 100,
    width: '200px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  popoverItem: {
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left',
    width: '100%',
    transition: 'background-color 0.1s ease',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  popoverText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  displayName: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '800',
    color: '#1e1b4b',
    letterSpacing: '-0.5px',
  },
  bio: {
    color: '#4b5563',
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '500',
    maxWidth: '85%',
    textAlign: 'center',
  },
  btn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.1s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnPrimaryGradient: {
    backgroundImage: 'linear-gradient(45deg, #6d28d9, #1d4ed8)', 
    color: '#fff',
    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    color: '#1f293a',
    border: '1px solid #d1d5db',
  },
  btnDanger: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  btnSearch: {
    backgroundColor: '#1f293a',
    color: '#fff',
    padding: '12px 20px',
  },
  demoPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  inputField: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'rgba(255,255,255,0.8)',
    fontSize: '15px',
    transition: 'all 0.1s ease',
    boxSizing: 'border-box',
  },
};

const injectStyles = () => {
  if (document.getElementById('custom-app-styles')) return;
  const style = document.createElement('style');
  style.id = 'custom-app-styles';
  style.innerHTML = `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }
    .skeleton-shimmer {
      background: #e5e7eb;
      background-image: linear-gradient(to right, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
      background-repeat: no-repeat;
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite linear;
    }
    button:active, .avatar-wrapper:active { transform: scale(0.97) !important; }
    button:hover, .popover-item:hover { filter: brightness(0.96); }
    .popover-item:hover { background-color: rgba(0,0,0,0.05) !important; }
    input:focus, textarea:focus { border-color: #818cf8 !important; box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2) !important; outline: none; }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  `;
  document.head.appendChild(style);
};
injectStyles();

const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const icons = {
    edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
    search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm6.5-6.5L22 22" />,
    friends: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    check: <polyline points="20 6 9 17 4 12" />,
    user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    camera: <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    demo: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
      {icons[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};


function App() {
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState({});
  const [currentUser, setCurrentUser] = useState("11111111-1111-1111-1111-111111111111");

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // STATE MỚI: Quản lý việc phóng to ảnh đại diện
  const [isViewingAvatar, setIsViewingAvatar] = useState(false);

  useEffect(() => {
    axios.defaults.headers.common['X-Mock-User'] = currentUser;
    setProfile(null); 
    setSearchQuery("");
    setSearchResults([]);
    setSentRequests({});
    setIsPopoverOpen(false); 
    setIsViewingAvatar(false); // Reset trạng thái xem ảnh khi đổi user
    fetchData(); 
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (isPopoverOpen && !event.target.closest('.avatar-wrapper-clickable')) {
            setIsPopoverOpen(false);
        }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPopoverOpen]);

  const fetchData = () => {
    axios.get('/api/users/me').then(res => { if (res.data.success) setProfile(res.data.data); }).catch(err => console.error(err));
    axios.get('/api/users/friends').then(res => { if (res.data.success) setFriends(res.data.data.friends); }).catch(err => console.error(err));
    axios.get('/api/users/friends/pending').then(res => { if (res.data.success) setPendingRequests(res.data.data.pendingRequests); }).catch(err => console.error(err));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const res = await axios.post('/api/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      if (res.data.success) { 
        toast.success("Đã cập nhật ảnh đại diện mới!", { position: "bottom-right", theme: "colored" }); 
        fetchData(); 
      }
    } catch (err) { 
      toast.error("Tải ảnh thất bại: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" }); 
    } finally { 
      setUploading(false); 
      event.target.value = null; 
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.warning("Tên không được để trống nha!", { position: "bottom-right", theme: "colored" });
    try {
      const res = await axios.patch('/api/users/me', { displayName: editName, bio: editBio });
      if (res.data.success) { 
        toast.success("🎉 Đã lưu thông tin thành công!", { position: "bottom-right", theme: "colored" }); 
        setIsEditing(false); 
        fetchData(); 
      }
    } catch (err) { 
      toast.error("Lỗi: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" }); 
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return toast.info("Nhập ít nhất 2 ký tự để tìm kiếm nha!", { position: "bottom-right", theme: "colored" });
    try {
      const res = await axios.get(`/api/users/search?q=${searchQuery}`);
      if (res.data.success) setSearchResults(res.data.data.users);
    } catch (err) { 
      toast.error("Lỗi tìm kiếm: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" }); 
    }
  };

  const handleAddFriend = async (targetId) => {
    try {
      const res = await axios.post(`/api/users/${targetId}/friends`);
      if (res.data.success) {
        setSentRequests(prev => ({ ...prev, [targetId]: true }));
        toast.success(res.data.message, { position: "bottom-right", theme: "colored" });
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error === "REQUEST_PENDING") {
        setSentRequests(prev => ({ ...prev, [targetId]: true }));
        toast.info(err.response.data.message, { position: "bottom-right", theme: "colored" });
      } else {
        toast.error("Lỗi: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" });
      }
    }
  };

  const handleRespondRequest = async (friendshipId, action) => {
    try {
      const res = await axios.patch(`/api/users/friends/${friendshipId}`, { action });
      if (res.data.success) { 
        toast.success(action === 'accept' ? "Đã trở thành bạn bè!" : "Đã từ chối lời mời.", { position: "bottom-right", theme: "colored" }); 
        fetchData(); 
      }
    } catch (err) { 
      toast.error("Lỗi: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" }); 
    }
  };

  const handleUnfriend = async (friendshipId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy kết bạn với người này không?")) return;
    try {
      const res = await axios.delete(`/api/users/friends/${friendshipId}`);
      if (res.data.success) {
        toast.success("🗑️ Đã hủy kết bạn thành công.", { position: "bottom-right", theme: "colored" });
        fetchData(); 
      }
    } catch (err) {
      toast.error("❌ Lỗi khi hủy kết bạn: " + (err.response?.data?.message || err.message), { position: "bottom-right", theme: "colored" });
    }
  };


  if (!profile) return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px', marginBottom: '25px', borderBottom: 'none'}}>
            <div style={{position: 'absolute', top: '-30px', left: '-30px', right: '-30px', height: '140px', backgroundColor: '#e5e7eb', borderRadius: '16px 16px 0 0'}}></div>
            <div style={{position: 'relative', zIndex: 10, marginBottom: '15px'}}>
                <div style={{...styles.avatarImg, border: 'none', backgroundColor: '#e5e7eb'}} className="skeleton-shimmer"></div>
            </div>
            <div style={{width: '200px', height: '28px', margin: '10px 0', borderRadius: '4px'}} className="skeleton-shimmer"></div>
            <div style={{width: '300px', height: '18px', borderRadius: '4px'}} className="skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrapper}>
      <ToastContainer hideProgressBar={true} />

      <div style={styles.container}>
        
        <div style={styles.demoPanel}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px'}}>
            <Icon name="demo" size={20} color="#6d28d9" />
            <strong style={{ color: '#6d28d9', fontSize: '15px' }}>Chế độ Demo: </strong>
            <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(209, 213, 219, 0.7)', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: '600', color: '#1f293a' }}>
              <option value="11111111-1111-1111-1111-111111111111">Phạm Thị Anh Thư</option>
              <option value="22222222-2222-2222-2222-222222222222">Nguyễn Minh Trí</option>
              <option value="44444444-4444-4444-4444-444444444444">Nguyễn Ngọc Quốc Long</option>
            </select>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>(Giả lập luồng gửi/nhận lời mời)</p>
        </div>
        
        {/* MÀN HÌNH CHỈNH SỬA PROFILE */}
        {isEditing && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(31, 27, 75, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '30px', borderRadius: '12px', width: '420px', textAlign: 'left', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb'}}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Chỉnh sửa thông tin</h3>
                <button onClick={() => setIsEditing(false)} style={{background:'none', border:'none', fontSize: '24px', cursor:'pointer', color: '#9ca3af', lineHeight: 1}}>×</button>
              </div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>Tên hiển thị</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} style={{...styles.inputField, marginBottom: '15px'}} placeholder="Nhập tên mới..." />
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>Tiểu sử</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} style={{...styles.inputField, minHeight: '110px', resize: 'none', marginBottom: '25px'}} placeholder="Mô tả ngắn về bạn..." />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setIsEditing(false)} style={{...styles.btn, ...styles.btnSecondary}}>Hủy</button>
                <button onClick={handleSaveProfile} style={{...styles.btn, ...styles.btnPrimaryGradient, padding: '12px 28px'}}>
                    <Icon name="check" size={16} color="#fff" /> Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MÀN HÌNH PHÓNG TO ẢNH ĐẠI DIỆN (LIGHTBOX) */}
        {isViewingAvatar && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}
            onClick={() => setIsViewingAvatar(false)} // Bấm viền đen để đóng
          >
            {/* Nút X Góc phải */}
            <button 
                onClick={() => setIsViewingAvatar(false)} 
                style={{ position: 'absolute', top: '25px', right: '35px', background: 'none', border: 'none', color: '#fff', fontSize: '40px', cursor: 'pointer', zIndex: 2010, opacity: 0.8 }}
            >
                &times;
            </button>
            
            {/* Ảnh phóng to */}
            <img 
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=1e1b4b&color=fff&size=500&font-size=0.4&bold=true`} 
                alt="Avatar Phóng To" 
                style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '4px solid rgba(255,255,255,0.2)', transition: 'transform 0.3s ease' }} 
                onClick={(e) => e.stopPropagation()} // Tránh click vào ảnh thì bị đóng
            />
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.profileHeader}>
            <div style={styles.profileCover}></div>
            
            <div 
                className="avatar-wrapper-clickable"
                style={styles.avatarWrapperClickable}
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            >
              <img 
                  src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=1e1b4b&color=fff&size=130&font-size=0.4&bold=true`} 
                  alt="Avt" 
                  style={styles.avatarImg} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=1e1b4b&color=fff&size=130&font-size=0.4&bold=true`; }} 
              />
              <div style={styles.onlineStatus}></div>

              {isPopoverOpen && (
                <div style={styles.avatarPopoverMenu}>
                    {/* ĐÃ SỬA: Mở Modal phóng to ảnh */}
                    <button className="popover-item" style={styles.popoverItem} onClick={(e) => { e.stopPropagation(); setIsViewingAvatar(true); setIsPopoverOpen(false); }}>
                        <Icon name="user" size={18} color="#555" />
                        <span style={styles.popoverText}>Xem ảnh đại diện</span>
                    </button>
                    {/* Chọn ảnh (Mở file input) */}
                    <button className="popover-item" style={{...styles.popoverItem, borderBottom: 'none'}} onClick={(e) => { e.stopPropagation(); document.getElementById('file-avatar-input').click(); setIsPopoverOpen(false); }}>
                        <Icon name="image" size={18} color="#555" />
                        <span style={styles.popoverText}>Chọn ảnh đại diện</span>
                    </button>
                </div>
              )}
            </div>
            
            <input 
                id="file-avatar-input"
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
                accept="image/*" 
            />

            <h2 style={styles.displayName}>{profile.displayName}</h2>
            <p style={styles.bio}>{profile.bio || "Chưa có tiểu sử."}</p>
            
            <button onClick={() => { setEditName(profile.displayName); setEditBio(profile.bio); setIsEditing(true); }} style={{...styles.btn, ...styles.btnPrimaryGradient, gap: '10px'}}>
              {uploading ? '⏳ Đang xử lý...' : (
                  <>
                    <Icon name="edit" size={16} color="#fff" />
                    Chỉnh sửa Profile
                  </>
              )}
            </button>
          </div>
        </div>

        {/* 2. KHỐI TÌM KIẾM BẠN BÈ */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Icon name="search" size={22} color="#6d28d9" />
            <h3 style={{ textAlign: 'left', margin: 0, fontSize: '20px', fontWeight: '700' }}>Tìm kiếm bạn bè</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <input placeholder="Nhập tên người dùng..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={styles.inputField} />
            <button onClick={handleSearch} style={{...styles.btn, ...styles.btnSearch, gap: '6px'}}>
                <Icon name="search" size={16} color="#fff" />
                Tìm
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              {searchResults.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(229, 231, 235, 0.6)', lastChild: {borderBottom: 'none'} }}>
                  <div style={{display:'flex', alignItems:'center', gap: '12px'}}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=fb7185&color=fff&size=40&font-size=0.4&bold=true`} style={{width:'40px', height:'40px', borderRadius:'50%'}} alt="u"/>
                    <span style={{fontWeight: '600', fontSize: '16px', color: '#1f293a'}}>{u.displayName}</span>
                  </div>
                  {sentRequests[u.id] ? (
                    <button disabled style={{...styles.btn, ...styles.btnSecondary, cursor: 'not-allowed', opacity: 0.7, padding: '9px 18px', fontSize: '13px'}}>
                        <Icon name="check" size={14} color="#6b7280" />
                        Đã gửi
                    </button>
                  ) : (
                    <button onClick={() => handleAddFriend(u.id)} style={{...styles.btn, ...styles.btnPrimaryGradient, padding: '9px 18px', fontSize: '13px', gap: '6px'}}>
                        <Icon name="addFriend" size={14} color="#fff" />
                        Kết bạn
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. KHỐI LỜI MỜI KẾT BẠN */}
        {pendingRequests.length > 0 && (
          <div style={{...styles.card, border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(254, 242, 242, 0.5)'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <Icon name="request" size={22} color="#b91c1c" />
                <h3 style={{ textAlign: 'left', margin: 0, color: '#b91c1c', fontSize: '20px', fontWeight: '700' }}>Lời mời kết bạn ({pendingRequests.length})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingRequests.map(req => (
                <div key={req.friendshipId} style={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <div style={{ flex: 1, textAlign: 'left', fontWeight: '600', fontSize: '16px', color: '#1f293a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon name="user" size={18} color="#9ca3af" />
                    {req.displayName} muốn kết bạn
                  </div>
                  <div style={{display:'flex', gap: '10px'}}>
                    <button onClick={() => handleRespondRequest(req.friendshipId, 'accept')} style={{...styles.btn, ...styles.btnPrimaryGradient, padding: '9px 20px', fontSize: '13px'}}>Đồng ý</button>
                    <button onClick={() => handleRespondRequest(req.friendshipId, 'reject')} style={{...styles.btn, ...styles.btnSecondary, padding: '9px 20px', fontSize: '13px'}}>Từ chối</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. KHỐI DANH SÁCH BẠN BÈ */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Icon name="friends" size={22} color="#6d28d9" />
            <h3 style={{ textAlign: 'left', margin: 0, fontSize: '20px', fontWeight: '700' }}>Bạn bè ({friends.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.length > 0 ? friends.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' }}>
                <img src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.displayName)}&background=e5e7eb&color=1e1b4b&size=50&font-size=0.4&bold=true`} alt="f" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '18px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.3)' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '17px', color: '#1e1b4b' }}>{f.displayName}</div>
                  <div style={{ fontSize: '13px', color: f.isOnline ? '#10b981' : '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{width:'10px', height:'10px', backgroundColor: f.isOnline ? '#10b981' : '#9ca3af', borderRadius:'50%', display:'inline-block'}}></span>
                    {f.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{...styles.btn, ...styles.btnSecondary, padding: '9px 15px', fontSize: '13px', gap: '6px'}}>
                    <Icon name="chat" size={14} color="#1f293a" />
                    Nhắn tin
                  </button>
                  <button onClick={() => handleUnfriend(f.friendshipId)} style={{...styles.btn, ...styles.btnDanger, padding: '9px 15px', fontSize: '13px'}}>
                    Hủy
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ padding: '40px', color: '#6b7280', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                 <Icon name="friends" size={32} color="#d1d5db" style={{marginBottom: '10px'}} />
                 <p style={{margin: 0}}>Chưa có bạn bè nào.</p>
                 <p style={{margin: '5px 0 0', fontSize: '13px'}}>Thử tìm kiếm để kết bạn nhé!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;