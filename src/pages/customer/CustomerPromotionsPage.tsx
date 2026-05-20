import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../../context/AppContext';
import { Gift, ArrowRight } from 'lucide-react';

export function CustomerPromotionsPage() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { tenants, coupons, luckyWheelActive } = useAppContext();
  const tenant = tenantSlug ? tenants.find(t => t.slug === tenantSlug) : null;
  const brandColor = tenant ? tenant.themeColor : '#4f46e5';

  const [phone, setPhone] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setSpinning(true);
    // Simulate spin
    setTimeout(() => {
      setSpinning(false);
      // Pick random prize from available coupons or default to 15%
      const now = new Date();
      const activeCoupons = coupons.filter(c => {
        if (c.tenantId !== tenantSlug) return false;
        if (c.status && c.status !== 'ACTIVE') return false;
        
        if (c.startDate) {
          const start = new Date(c.startDate);
          if (now < start) return false;
        }
        if (c.endDate) {
          const end = new Date(c.endDate);
          end.setHours(23, 59, 59, 999);
          if (now > end) return false;
        }
        return true;
      });
      setPrize(activeCoupons[0]?.prizes?.[0]?.label || '15% Off');
    }, 2000);
  };

  if (!luckyWheelActive) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No active promotions</h2>
        <p className="text-gray-500">Please check back later or start your booking.</p>
        <button onClick={() => navigate(`/${tenantSlug}/booking`)} className="mt-6 px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: brandColor }}>
          Book Now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {spinning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin mb-4" />
              <p className="text-blue-600 font-bold animate-pulse">Spinning the wheel...</p>
            </div>
          </div>
        )}
        
        {prize && !spinning && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <Gift className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-gray-600 mb-6">You've won <span className="font-bold text-green-600 text-xl">{prize}</span> on your next visit!</p>
            <p className="text-sm text-gray-500 mb-8 border border-dashed border-gray-300 p-3 rounded-lg bg-gray-50">
              Promo code has been applied to your phone number: <strong>{phone}</strong>
            </p>
            <button onClick={() => navigate(`/${tenantSlug}/booking`)} className="w-full py-4 rounded-xl text-white font-bold tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ backgroundColor: brandColor }}>
              Book Appointment Now
            </button>
          </div>
        )}

        <div className="p-8 pb-10 text-center relative z-0">
          <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-md flex items-center justify-center mb-6 border border-gray-100">
            <span className="font-bold text-2xl" style={{ color: brandColor }}>
              {tenant?.name.charAt(0) || 'V'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vòng Quay May Mắn</h1>
          <p className="text-sm text-gray-500 mb-8">Dành riêng cho khách hàng mới của <strong style={{color: brandColor}}>{tenant?.name || 'Salon'}</strong></p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
            <Gift className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-blue-800 text-center leading-relaxed">
              Nhập số điện thoại của bạn để kiểm tra điều kiện tham gia và nhận quà tặng hoặc giảm giá ngay lập tức!
            </p>
          </div>

          <form onSubmit={handleContinue} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">📞</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0898462080"
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 text-lg transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!phone}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: brandColor }}
            >
              Tiếp tục <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
