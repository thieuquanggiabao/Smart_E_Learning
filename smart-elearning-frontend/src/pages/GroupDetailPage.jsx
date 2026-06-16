import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Mail, Plus, Shield, ArrowLeft, Video, Trash2, Send, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';
import { uploadFileToStorage } from '../utils/uploadHelper';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Lấy user hiện tại để check quyen
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadGroupDetail();
    loadMessages();

    // ─── SOCKET.IO REALTIME ───
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinGroup', groupId);
    });

    // Lắng nghe sự kiện thêm thành viên
    socket.on('memberAdded', (newMember) => {
      setMembers(prev => {
        if (prev.find(m => m.userId === newMember.userId)) return prev;
        return [...prev, newMember];
      });
    });

    // Lắng nghe sự kiện tin nhắn mới
    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Lắng nghe nhóm bị xóa
    socket.on('groupDeleted', () => {
      alert('Chủ nhóm đã giải tán nhóm này!');
      navigate('/groups');
    });

    return () => {
      socket.emit('leaveGroup', groupId);
      socket.disconnect();
    };
  }, [groupId]);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadGroupDetail = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      setMembers(res.data.members || []);
    } catch (err) {
      alert('Không thể tải thông tin nhóm');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/messages`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Lỗi tải tin nhắn', err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviting(true);
    try {
      const res = await api.post(`/groups/${groupId}/members`, { email: inviteEmail });
      const newMember = res.data.member;
      setMembers(prev => {
        if (prev.find(m => m.userId === newMember.userId)) return prev;
        return [...prev, newMember];
      });
      setInviteEmail('');
      alert('Đã thêm thành viên!');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm thành viên');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Bạn có chắc muốn giải tán nhóm này? Toàn bộ tin nhắn và file sẽ bị xóa vĩnh viễn.')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      alert('Giải tán nhóm thành công');
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi giải tán nhóm');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() && !chatFile) return;

    setSendingChat(true);
    try {
      let finalFileUrl = '';
      let fileType = '';

      if (chatFile) {
        if (chatFile.size > 50 * 1024 * 1024) {
          alert('File đính kèm không được vượt quá 50MB');
          setSendingChat(false);
          return;
        }
        
        fileType = chatFile.type.startsWith('image/') ? 'image' : 
                   chatFile.type.startsWith('video/') ? 'video' : 'document';

        finalFileUrl = await uploadFileToStorage(chatFile, `groups/${groupId}/chat`);
      }

      // Emit qua socket
      socketRef.current.emit('sendMessage', {
        groupId,
        senderId: user.id || user.userId, // fallback tuỳ thuộc jwt payload
        senderName: user.name || 'Học viên',
        text: chatText,
        fileUrl: finalFileUrl,
        fileType
      });

      setChatText('');
      setChatFile(null);
    } catch (err) {
      alert('Không thể gửi tin nhắn hoặc file: ' + err.message);
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!group) return null;

  const isOwner = user?.id === group.ownerId || user?.userId === group.ownerId;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full overflow-hidden pb-4">
      
      {/* Header */}
      <div className="relative h-40 sm:h-48 rounded-3xl overflow-hidden shrink-0 mb-4 border border-white/10 group-header-bg shadow-2xl flex-none">
        <img 
          src={group.coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'} 
          alt="cover" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/50 to-transparent" />
        
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <button 
              onClick={() => navigate('/groups')}
              className="p-2 bg-black/40 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            {isOwner && (
              <button 
                onClick={handleDeleteGroup}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors backdrop-blur-md text-sm font-medium"
              >
                <Trash2 size={16} /> Giải tán nhóm
              </button>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{group.name}</h1>
            <p className="text-slate-300 max-w-2xl text-sm line-clamp-1">{group.description}</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* Left: Tương lai sẽ là Phòng họp trực tuyến / Tin nhắn */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl flex flex-col overflow-hidden relative">
          
          {/* Nút vào phòng học (Tạm thời Disabled) */}
          <div className="h-14 bg-indigo-900/20 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Thảo luận chung
            </div>
            <button disabled className="px-3 py-1.5 bg-indigo-600/30 text-indigo-300 text-xs rounded-lg font-medium cursor-not-allowed flex items-center gap-1">
              <Video size={14}/> Tham gia phòng họp Live
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Mail size={40} className="opacity-20" />
                <p>Chưa có tin nhắn nào. Bắt đầu trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === (user?.id || user?.userId);
                return (
                  <div key={msg.id || idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1">
                      {msg.senderName?.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-slate-400 mb-1 px-1">{msg.senderName}</span>
                      
                      <div className={`rounded-2xl p-3 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#232336] text-slate-200 rounded-tl-sm'}`}>
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        
                        {/* File Attachment */}
                        {msg.fileUrl && (
                          <div className={`mt-2 ${msg.text ? 'pt-2 border-t border-white/10' : ''}`}>
                            {msg.fileType === 'image' ? (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                <img src={msg.fileUrl} alt="attachment" className="max-w-xs rounded-xl hover:opacity-90 transition-opacity" />
                              </a>
                            ) : msg.fileType === 'video' ? (
                              <video src={msg.fileUrl} controls className="max-w-xs rounded-xl" />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-colors">
                                <FileText size={20} className="text-indigo-300" />
                                <span className="text-xs font-medium underline">Xem tài liệu đính kèm</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-[#13131f]/80 border-t border-white/5 shrink-0">
            {chatFile && (
              <div className="mb-2 px-3 py-1.5 bg-black/30 w-fit rounded-lg flex items-center gap-2 text-xs text-slate-300 border border-white/10">
                <Paperclip size={12} className="text-indigo-400" />
                <span className="truncate max-w-[150px]">{chatFile.name}</span>
                <button onClick={() => setChatFile(null)} className="hover:text-white"><X size={14}/></button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <label className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors text-slate-400 hover:text-indigo-300 shrink-0">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={e => setChatFile(e.target.files[0])}
                  // Cho phep nhieu dinh dang
                  accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                />
                <Paperclip size={20} />
              </label>
              
              <input
                type="text"
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit"
                disabled={sendingChat || (!chatText.trim() && !chatFile)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
              >
                {sendingChat ? <Spinner size="sm" /> : <Send size={20} />}
              </button>
            </form>
          </div>

        </div>

        {/* Right: Members Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          
          {/* Mời người */}
          <div className="bg-[#13131f] border border-white/10 rounded-3xl p-5">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Mail className="text-indigo-400" size={16} />
              Thêm thành viên
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Nhập email..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit"
                disabled={inviting}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
              >
                {inviting ? <Spinner size="sm" /> : <Plus size={14} />}
              </button>
            </form>
          </div>

          {/* Danh sách thành viên */}
          <div className="bg-[#13131f] border border-white/10 rounded-3xl p-5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-white text-sm font-medium flex items-center gap-2">
                <Users className="text-emerald-400" size={16} />
                Thành viên
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-md text-slate-300">
                {members.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {members.map(member => (
                <div key={member.userId} className="flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 text-xs">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-medium text-white truncate flex items-center gap-1.5">
                      {member.name}
                      {member.role === 'owner' && <Shield size={10} className="text-amber-400" />}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
