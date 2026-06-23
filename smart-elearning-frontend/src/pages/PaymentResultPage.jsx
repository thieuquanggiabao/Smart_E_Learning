import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';

const PaymentResultPage = () => {
  const [status, setStatus] = useState('processing');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const cancel = params.get('cancel');
    const orderCode = params.get('orderCode');

    if (code === '00' && cancel !== 'true' && orderCode) {
      // Vì test ở local không có Webhook, Frontend sẽ chủ động gọi Backend để kiểm tra và Enroll khóa học
      api.post('/payment/verify-payment', { orderCode })
        .then(() => {
          setStatus('success');
        })
        .catch(err => {
          console.error('Lỗi khi verify:', err);
          setStatus('failed');
        });
    } else {
      setStatus('failed');
    }
  }, [location]);

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
      <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center">
        {status === 'processing' && (
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Đang xử lý giao dịch...</h2>
            <p className="text-slate-400">Vui lòng không đóng trang web</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Thanh toán Thành công!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Cảm ơn bạn đã mua khóa học. Hệ thống đang tự động ghi danh và cấp quyền truy cập. Bạn có thể vào học ngay bây giờ!
            </p>
            <button
              onClick={() => navigate('/my-learning')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl
                         shadow-lg shadow-emerald-500/30 transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              Vào học ngay <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Giao dịch thất bại!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Bạn đã hủy thanh toán hoặc có lỗi xảy ra trong quá trình giao dịch. Vui lòng thử lại sau!
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl
                         transition-all duration-200"
            >
              Quay về Danh sách khóa học
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
