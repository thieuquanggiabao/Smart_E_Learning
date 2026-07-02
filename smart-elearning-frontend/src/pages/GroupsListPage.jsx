import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, Image as ImageIcon, Upload, Search } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';
import { uploadFileToStorage } from '../utils/uploadHelper';

export default function GroupsListPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (error) {
      console.error('Lỗi tải danh sách nhóm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      let finalCoverImage = '';
      if (coverFile) {
        if (coverFile.size > 5 * 1024 * 1024) {
          alert('Ảnh bìa không được vượt quá 5MB');
          setCreating(false);
          return;
        }
        finalCoverImage = await uploadFileToStorage(coverFile, 'groups');
      }

      const res = await api.post('/groups', { name, description, coverImage: finalCoverImage });
      setGroups(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setCoverFile(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi tạo nhóm');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="text-indigo-400" /> Nhóm của tôi
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium text-sm"
        >
          <Plus size={16} /> Tạo Nhóm Mới
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm nhóm theo tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <Users size={48} className="mx-auto text-slate-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Bạn chưa tham gia nhóm nào</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Tạo nhóm để mời bạn bè, cùng nhau trao đổi bài học và chuẩn bị cho phòng học trực tuyến.
          </p>
        </div>
      ) : (() => {
        const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (filteredGroups.length === 0) {
          return (
            <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/5">
              <Search size={40} className="mx-auto text-slate-500 mb-3" />
              <h2 className="text-lg font-bold text-white mb-1">Không tìm thấy nhóm</h2>
              <p className="text-slate-400 text-sm">Không có nhóm nào khớp với "{searchQuery}"</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="bg-black/40 border border-white/5 hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="h-32 bg-indigo-900/50 relative overflow-hidden">
                {group.coverImage ? (
                  <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-400/50">
                    <ImageIcon size={40} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{group.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">{group.description || 'Chưa có mô tả'}</p>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-slate-500">
                  <Users size={14} className="mr-1.5" />
                  {group.memberIds?.length || 1} thành viên
                </div>
              </div>
            </div>
            ))}
          </div>
        );
      })()}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#13131f] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Tạo Nhóm Mới</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên nhóm *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Ví dụ: Nhóm Học ReactJS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mô tả nhóm</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Mô tả mục đích của nhóm..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ảnh bìa (Không bắt buộc)</label>
                <label className="w-full flex items-center justify-center gap-2 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 cursor-pointer hover:bg-white/5 transition-colors border-dashed">
                  <Upload size={18} />
                  <span>{coverFile ? coverFile.name : 'Chọn ảnh từ máy tính (Tối đa 5MB)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setCoverFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {creating ? <Spinner size="sm" /> : <Plus size={16} />}
                  Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
