import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Plus, Shield, ArrowLeft, Trash2, Send, Paperclip, FileText, X, Radio, Zap, MessageSquare, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';
import { uploadFileToStorage } from '../utils/uploadHelper';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const [liveRoom, setLiveRoom] = useState(null);
  const [startingLive, setStartingLive] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  useEffect(() => {
    loadGroupDetail();
    loadMessages();
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('joinGroup', groupId));
    socket.on('memberAdded', (m) => setMembers(prev => prev.find(x => x.userId === m.userId) ? prev : [...prev, m]));
    socket.on('newMessage', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('roomStarted', (data) => setLiveRoom({ active: true, ...data }));
    socket.on('roomEnded', () => setLiveRoom(prev => prev ? { ...prev, active: false } : null));
    socket.on('groupDeleted', () => { alert('Chủ nhóm đã giải tán nhóm này!'); navigate('/groups'); });
    return () => { socket.emit('leaveGroup', groupId); socket.disconnect(); };
  }, [groupId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadGroupDetail = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data); setMembers(res.data.members || []);
      if (res.data.liveRoom?.active) setLiveRoom(res.data.liveRoom);
    } catch { alert('Không thể tải thông tin nhóm'); navigate('/groups'); }
    finally { setLoading(false); }
  };

  const loadMessages = async () => {
    try { const res = await api.get(`/groups/${groupId}/messages`); setMessages(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.post(`/groups/${groupId}/members`, { email: inviteEmail });
      const m = res.data.member;
      setMembers(prev => prev.find(x => x.userId === m.userId) ? prev : [...prev, m]);
      setInviteEmail(''); setShowInvitePanel(false);
      alert('Đã thêm thành viên!');
    } catch (err) { alert(err.response?.data?.message || 'Lỗi thêm thành viên'); }
    finally { setInviting(false); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Bạn có chắc muốn giải tán nhóm này?')) return;
    try { await api.delete(`/groups/${groupId}`); navigate('/groups'); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi giải tán nhóm'); }
  };

  const handleUpdateRole = async (targetUserId, role) => {
    try {
      await api.put(`/groups/${groupId}/members/${targetUserId}/role`, { role });
      await loadGroupDetail();
      alert(`Đã cập nhật quyền thành công!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật quyền');
    }
  };

  const handleStartLive = async () => {
    setStartingLive(true);
    try { await api.post(`/live/${groupId}/start`); }
    catch (err) {
      if (err.response?.status === 409) navigate(`/live/${groupId}`);
      else alert(err.response?.data?.message || 'Lỗi tạo phòng live');
    } finally { setStartingLive(false); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() && !chatFile) return;
    setSendingChat(true);
    try {
      let finalFileUrl = '', fileType = '';
      if (chatFile) {
        if (chatFile.size > 50 * 1024 * 1024) { alert('File không được vượt quá 50MB'); setSendingChat(false); return; }
        fileType = chatFile.type.startsWith('image/') ? 'image' : chatFile.type.startsWith('video/') ? 'video' : 'document';
        finalFileUrl = await uploadFileToStorage(chatFile, `groups/${groupId}/chat`);
      }
      socketRef.current.emit('sendMessage', { groupId, senderId: user.id || user.userId, senderName: user.name || 'Học viên', text: chatText, fileUrl: finalFileUrl, fileType });
      setChatText(''); setChatFile(null);
    } catch (err) { alert('Không thể gửi: ' + err.message); }
    finally { setSendingChat(false); }
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!group) return null;

  const myId = user?.id || user?.userId;
  const isOwner = myId === group.ownerId;
  const isAdmin = group.adminIds?.includes(myId) || isOwner;

  // Inline style helpers
  const S = {
    page: { display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1100px', margin: '0 auto', gap: '12px', padding: '0 0 12px 0' },
    banner: { position: 'relative', borderRadius: '20px', overflow: 'hidden', minHeight: '130px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' },
    row: { display: 'flex', gap: '12px', flex: 1, minHeight: 0 },
  };

  return (
    <div style={S.page}>

      {/* ── BANNER ── */}
      <div style={S.banner}>
        <img src={group.coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,#0d0d1a 0%,rgba(13,13,26,.5) 60%,transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate('/groups')} style={{ padding: 7, background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', backdropFilter: 'blur(8px)' }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {liveRoom?.active
                ? <button onClick={() => navigate(`/live/${groupId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(5,150,105,.85)', borderRadius: 10, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><Radio size={14} /> Tham gia Live</button>
                : isAdmin && <button onClick={handleStartLive} disabled={startingLive} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(79,70,229,.8)', borderRadius: 10, color: '#c7d2fe', border: '1px solid rgba(99,102,241,.4)', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: startingLive ? .6 : 1 }}>
                    {startingLive ? '⏳ Đang tạo...' : <><Zap size={14} /> Bật Live</>}
                  </button>}
              {isOwner && <button onClick={handleDeleteGroup} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(239,68,68,.2)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><Trash2 size={14} /> Giải tán</button>}
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, color: '#fff', margin: 0 }}>{group.name}</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{group.description}</p>
          </div>
        </div>
      </div>

      {/* ── MOBILE TABS (ẩn trên desktop bằng CSS) ── */}
      <div className="grp-tabs" style={{ gap: 8, flexShrink: 0 }}>
        {[{ id: 'chat', icon: <MessageSquare size={15} />, label: 'Trò chuyện' }, { id: 'members', icon: <Users size={15} />, label: `Thành viên (${members.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: activeTab === t.id ? 'rgba(99,102,241,.25)' : 'rgba(255,255,255,.05)', color: activeTab === t.id ? '#818cf8' : '#64748b', borderBottom: activeTab === t.id ? '2px solid #6366f1' : '2px solid transparent', transition: 'all .2s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── MAIN ROW ── */}
      <div style={S.row}>

        {/* CHAT PANEL */}
        <div className={`grp-chat${activeTab !== 'chat' ? ' grp-hidden' : ''}`} style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(99,102,241,.08)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Thảo luận chung</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} className="custom-scrollbar">
            {messages.length === 0
              ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: 8, minHeight: 120 }}><MessageSquare size={36} style={{ opacity: .2 }} /><p style={{ margin: 0, fontSize: 13 }}>Chưa có tin nhắn. Bắt đầu trò chuyện!</p></div>
              : messages.map((msg, i) => {
                  const me = msg.senderId === myId;
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', gap: 10, flexDirection: me ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: me ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{msg.senderName?.charAt(0).toUpperCase()}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '72%', alignItems: me ? 'flex-end' : 'flex-start', gap: 3 }}>
                        <span style={{ fontSize: 11, color: '#64748b', paddingLeft: 4, paddingRight: 4 }}>
                          {!me && <span style={{ fontWeight: 600, color: '#94a3b8', marginRight: 6 }}>{msg.senderName}</span>}
                          {fmt(msg.createdAt)}
                        </span>
                        <div style={{ padding: '10px 14px', borderRadius: me ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: me ? 'linear-gradient(135deg,#4f46e5,#6366f1)' : '#1e1e32', color: '#fff', fontSize: 14, lineHeight: 1.5, border: me ? 'none' : '1px solid rgba(255,255,255,.06)', wordBreak: 'break-word' }}>
                          {msg.text && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
                          {msg.fileUrl && (
                            <div style={{ marginTop: msg.text ? 8 : 0, paddingTop: msg.text ? 8 : 0, borderTop: msg.text ? '1px solid rgba(255,255,255,.1)' : 'none' }}>
                              {msg.fileType === 'image'
                                ? <a href={msg.fileUrl} target="_blank" rel="noreferrer"><img src={msg.fileUrl} alt="" style={{ maxWidth: 220, borderRadius: 10 }} /></a>
                                : msg.fileType === 'video'
                                  ? <video src={msg.fileUrl} controls style={{ maxWidth: 220, borderRadius: 10 }} />
                                  : <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,0,0,.2)', borderRadius: 10, color: '#c7d2fe', textDecoration: 'none', fontSize: 12 }}><FileText size={16} /> Xem tài liệu</a>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0, background: 'rgba(13,13,26,.7)' }}>
            {chatFile && (
              <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(0,0,0,.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', fontSize: 12, color: '#c7d2fe' }}>
                <Paperclip size={12} style={{ color: '#818cf8' }} />
                <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatFile.name}</span>
                <button onClick={() => setChatFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={13} /></button>
              </div>
            )}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => setChatFile(e.target.files[0])} accept="image/*,video/*,.pdf,.doc,.docx,.zip" />
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: chatFile ? '#818cf8' : '#64748b', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><Paperclip size={18} /></button>
              <input type="text" value={chatText} onChange={e => setChatText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }} placeholder="Nhập tin nhắn... (Enter để gửi)" style={{ flex: 1, background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none' }} />
              <button type="submit" disabled={sendingChat || (!chatText.trim() && !chatFile)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: (sendingChat || (!chatText.trim() && !chatFile)) ? .5 : 1 }}>
                {sendingChat ? <Spinner size="sm" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>

        {/* MEMBERS SIDEBAR */}
        <div className={`grp-sidebar${activeTab !== 'members' ? ' grp-hidden' : ''}`} style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Invite */}
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, overflow: 'hidden' }}>
            <button onClick={() => setShowInvitePanel(v => !v)} style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}><UserPlus size={16} style={{ color: '#818cf8' }} /> Thêm thành viên</div>
              {showInvitePanel ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
            </button>
            {showInvitePanel && (
              <div style={{ padding: '0 16px 14px' }}>
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Nhập địa chỉ email..." style={{ width: '100%', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="submit" disabled={inviting} style={{ width: '100%', padding: 9, background: 'rgba(99,102,241,.7)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: inviting ? .6 : 1 }}>
                    {inviting ? <Spinner size="sm" /> : <><Plus size={14} /> Thêm vào nhóm</>}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Members */}
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: '#fff' }}><Users size={16} style={{ color: '#34d399' }} /> Thành viên</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', background: 'rgba(255,255,255,.08)', borderRadius: 6, color: '#94a3b8' }}>{members.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }} className="custom-scrollbar">
              {members.map(m => {
                const isTargetOwner = m.userId === group.ownerId;
                const isTargetAdmin = group.adminIds?.includes(m.userId) || m.role === 'admin';
                return (
                  <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, marginBottom: 4, background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: isTargetOwner ? 'linear-gradient(135deg,#d97706,#f59e0b)' : isTargetAdmin ? 'linear-gradient(135deg,#10b981,#34d399)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
                      {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        
                        {/* System Role Badge */}
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: m.systemRole === 'instructor' ? 'rgba(56,189,248,.15)' : 'rgba(148,163,184,.15)', color: m.systemRole === 'instructor' ? '#38bdf8' : '#94a3b8', textTransform: 'uppercase' }}>
                          {m.systemRole === 'instructor' ? 'Giảng viên' : 'Học viên'}
                        </span>

                        {/* Group Role Badge */}
                        {isTargetOwner && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,.15)', color: '#f59e0b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Shield size={10} /> Trưởng nhóm
                          </span>
                        )}
                        {!isTargetOwner && isTargetAdmin && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,.15)', color: '#10b981', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Shield size={10} /> Quản trị viên
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                    </div>

                    {/* Role Management Buttons */}
                    {isAdmin && !isTargetOwner && m.userId !== myId && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isTargetAdmin && (
                          <button 
                            onClick={() => { if(window.confirm(`Thăng cấp Admin cho ${m.name}?`)) handleUpdateRole(m.userId, 'admin') }} 
                            style={{ padding: '4px 8px', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}
                          >
                            Thăng cấp
                          </button>
                        )}
                        {isOwner && isTargetAdmin && (
                          <button 
                            onClick={() => { if(window.confirm(`Hủy quyền Admin của ${m.name}?`)) handleUpdateRole(m.userId, 'member') }} 
                            style={{ padding: '4px 8px', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}
                          >
                            Hủy quyền
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── CSS ── */}
      <style>{`
        /* Tabs: ẩn trên desktop */
        .grp-tabs { display: none; }

        /* Desktop ≥768px: luôn show cả 2 panel */
        @media (min-width: 768px) {
          .grp-chat { display: flex !important; }
          .grp-sidebar { display: flex !important; width: 260px !important; }
        }

        /* Mobile <768px: hiện tab bar, ẩn panel theo activeTab */
        @media (max-width: 767px) {
          .grp-tabs { display: flex; }
          .grp-sidebar { width: 100% !important; }
          .grp-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
