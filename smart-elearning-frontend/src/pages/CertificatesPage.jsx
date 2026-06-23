import React, { useState, useEffect } from 'react';
import { Award, Download, Search, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { Spinner } from '../components/ui';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/users/certificates');
        setCertificates(res.data.certificates || []);
      } catch (error) {
        console.error('Lỗi lấy danh sách chứng chỉ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Certificates</h1>
        <p className="text-slate-400 text-sm mt-1">Your earned certificates from completed courses</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Award size={36} className="text-amber-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No certificates yet</h2>
          <p className="text-slate-400 text-sm">Complete courses to earn certificates of achievement</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award size={100} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <Award className="text-amber-400" size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                  {cert.courseTitle}
                </h3>
                
                <div className="mt-auto pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span>Score: {cert.finalScore}/10</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-amber-500/60 font-mono">{cert.certificateCode}</span>
                    <span className="text-xs text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
