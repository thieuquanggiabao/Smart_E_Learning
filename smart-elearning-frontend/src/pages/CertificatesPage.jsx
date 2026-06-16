import { Award, Download, Search } from 'lucide-react';

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Certificates</h1>
        <p className="text-slate-400 text-sm mt-1">Your earned certificates from completed courses</p>
      </div>

      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Award size={36} className="text-amber-400" />
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">No certificates yet</h2>
        <p className="text-slate-400 text-sm">Complete courses to earn certificates of achievement</p>
      </div>
    </div>
  );
}
