import React, { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null); // id of user being edited

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingRole(null);
    } catch (error) {
      alert('Không thể đổi Role: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác!')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('Lỗi khi xóa người dùng: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Users className="text-indigo-400" size={28} />
        <h1 className="text-2xl font-bold text-white">Quản lý người dùng</h1>
      </div>

      <div className="bg-[#13131f] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Tên / Email</th>
                <th className="px-6 py-4 font-medium">Vai trò (Role)</th>
                <th className="px-6 py-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{user.name || 'Chưa cập nhật tên'}</div>
                    <div className="text-slate-400 text-xs">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingRole === user.id ? (
                      <select 
                        defaultValue={user.role || 'student'}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        onBlur={() => setEditingRole(null)}
                        className="bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none"
                        autoFocus
                      >
                        <option value="student">Học viên (Student)</option>
                        <option value="teacher">Giảng viên (Teacher)</option>
                        <option value="admin">Quản trị (Admin)</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs rounded-lg border font-medium inline-flex items-center gap-1.5
                        ${user.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          user.role === 'teacher' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {(user.role || 'student').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setEditingRole(user.id)}
                      className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors"
                      title="Đổi Role"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                      title="Xóa người dùng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
