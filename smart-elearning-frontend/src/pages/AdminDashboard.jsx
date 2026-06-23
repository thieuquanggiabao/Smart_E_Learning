import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Server, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ cpu: [], memory: [] });
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorOnly, setErrorOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, metricsRes, revRes] = await Promise.all([
        api.get('/admin/logs').catch(() => ({ data: { logs: [] } })),
        api.get('/admin/metrics').catch(() => ({ data: { cpu: [], memory: [] } })),
        api.get('/admin/revenue').catch(() => ({ data: { totalRevenue: 0 } }))
      ]);
      setLogs(logsRes.data.logs || []);
      setMetrics({
        cpu: metricsRes.data.cpu || [],
        memory: metricsRes.data.memory || []
      });
      setRevenue(revRes.data.totalRevenue || 0);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh mỗi phút
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = errorOnly 
    ? logs.filter(log => log.severity === 'ERROR' || log.severity === 'CRITICAL')
    : logs;

  const renderSeverityBadge = (severity) => {
    switch (severity) {
      case 'ERROR':
      case 'CRITICAL':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-md border border-red-500/30 flex items-center gap-1 w-fit"><AlertCircle size={12}/> Error</span>;
      case 'WARNING':
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-md border border-amber-500/30 w-fit">Warning</span>;
      default:
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md border border-blue-500/30 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Info</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="text-indigo-400" />
            System Administration
          </h1>
          <p className="text-slate-400 mt-1">Giám sát tài nguyên và nhật ký hệ thống (Cloud Run)</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors disabled:opacity-50 border border-white/10"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-emerald-400 font-medium mb-1">Tổng doanh thu hệ thống (Admin)</p>
          <h2 className="text-3xl font-bold text-white">{revenue.toLocaleString()} VND</h2>
          <p className="text-slate-400 text-sm mt-1">Chiết khấu thu được từ các khóa học trả phí</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Activity size={32} className="text-emerald-400" />
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPU Chart */}
        <div className="bg-[#13131f] border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="text-emerald-400" size={18} />
            CPU Utilization (%)
          </h2>
          <div className="h-64 w-full">
            {loading && metrics.cpu.length === 0 ? (
              <div className="h-full flex items-center justify-center"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.cpu}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#ffffff50" 
                    tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                    tick={{fontSize: 12}}
                  />
                  <YAxis stroke="#ffffff50" tick={{fontSize: 12}} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#ffffff20', borderRadius: '8px' }}
                    labelFormatter={(label) => format(new Date(label), 'HH:mm:ss dd/MM')}
                  />
                  <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} name="CPU %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-[#13131f] border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Server className="text-purple-400" size={18} />
            Memory Utilization (%)
          </h2>
          <div className="h-64 w-full">
            {loading && metrics.memory.length === 0 ? (
              <div className="h-full flex items-center justify-center"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.memory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#ffffff50" 
                    tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                    tick={{fontSize: 12}}
                  />
                  <YAxis stroke="#ffffff50" tick={{fontSize: 12}} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#ffffff20', borderRadius: '8px' }}
                    labelFormatter={(label) => format(new Date(label), 'HH:mm:ss dd/MM')}
                  />
                  <Line type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={2} dot={false} name="RAM %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Logs Section */}
      <div className="bg-[#13131f] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">System Logs</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={errorOnly} 
              onChange={e => setErrorOnly(e.target.checked)}
              className="rounded bg-black/50 border-white/20 text-red-500 focus:ring-red-500/20"
            />
            <span className="text-sm text-slate-300 select-none">Chỉ hiện Lỗi</span>
          </label>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Thời gian</th>
                <th className="px-6 py-4 font-medium">Mức độ</th>
                <th className="px-6 py-4 font-medium">Nội dung (Message)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <Spinner className="mx-auto mb-2" /> Đang tải dữ liệu log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    Không có bản ghi log nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderSeverityBadge(log.severity)}
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-2xl truncate font-mono text-xs" title={log.message}>
                      {log.message}
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
}
