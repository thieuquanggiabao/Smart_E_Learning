import { useState, useRef } from 'react';
import { Settings, User, Bell, Shield, Palette, Camera, Save, Phone, AlignLeft, Link, Globe, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { uploadFileToStorage } from '../utils/uploadHelper';
import { Spinner } from '../components/ui';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  
  // States cho form profile
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  const [facebook, setFacebook] = useState(user?.socialLinks?.facebook || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ảnh đại diện không được vượt quá 2MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tên không được để trống');
      return;
    }
    
    setSaving(true);
    try {
      let finalAvatarUrl = user?.avatarUrl;
      
      // Upload ảnh mới nếu có
      if (avatarFile) {
        finalAvatarUrl = await uploadFileToStorage(avatarFile, `users/${user.userId || user.id}/avatar`);
      }

      const updateData = {
        name,
        phone,
        bio,
        avatarUrl: finalAvatarUrl,
        socialLinks: { facebook, linkedin, github }
      };

      const res = await api.put('/users/profile', updateData);
      
      // Cập nhật context & local storage
      updateUser(res.data.user);
      
      alert('Đã cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-indigo-400" /> Cài đặt & Hồ sơ
        </h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý thông tin cá nhân và tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cột trái: Cài đặt menu (Placeholder cho các tính năng khác sau này) */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 font-medium">
            <User size={18} /> Hồ sơ cá nhân
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl transition-colors font-medium">
            <Shield size={18} /> Bảo mật
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl transition-colors font-medium">
            <Bell size={18} /> Thông báo
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl transition-colors font-medium">
            <Palette size={18} /> Giao diện
          </button>
        </div>

        {/* Cột phải: Form Hồ sơ */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h2 className="text-white font-semibold mb-6 flex items-center gap-2 text-lg">
              Thông tin công khai
            </h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden border-2 border-indigo-500/30">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() ?? 'U'
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 rounded-full border-2 border-[#0d0d1a] flex items-center justify-center text-white hover:bg-indigo-500 transition-colors shadow-lg"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">{user?.name ?? 'Người dùng'}</p>
                  <p className="text-slate-400 text-sm">{user?.email ?? ''}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {user?.role ?? 'Học viên'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full my-6"></div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên hiển thị <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ví dụ: Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Số điện thoại liên hệ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tiểu sử (Bio)</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <AlignLeft size={16} className="text-slate-500" />
                    </div>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 custom-scrollbar resize-none"
                      placeholder="Giới thiệu đôi nét về bản thân..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full my-6"></div>

              {/* Social Links */}
              <div>
                <h3 className="text-white font-medium mb-4">Liên kết mạng xã hội</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe size={16} className="text-blue-500" />
                    </div>
                    <input
                      type="url"
                      value={facebook}
                      onChange={e => setFacebook(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Link Facebook cá nhân..."
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link size={16} className="text-sky-500" />
                    </div>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Link LinkedIn..."
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSign size={16} className="text-white" />
                    </div>
                    <input
                      type="url"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Link GitHub..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Spinner size="sm" /> : <Save size={18} />}
                  Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
