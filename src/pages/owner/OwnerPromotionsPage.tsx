import React, { useState } from 'react';
import { useAppContext, Coupon, PrizeConfig } from '../../context/AppContext';
import { Plus, Tag, Settings, X, Calendar as CalendarIcon, Percent, Gift } from 'lucide-react';

export function OwnerPromotionsPage() {
  const { tenantSettings, coupons, addCoupon, updateCoupon, deleteCoupon, luckyWheelActive, setLuckyWheelActive } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    name: '', code: '', discountPercentage: 15, startDate: '', endDate: '',
    prizes: [
      { label: '10% Off', discountPercentage: 10, probability: 20 },
      { label: '15% Off', discountPercentage: 15, probability: 10 },
      { label: '20% Off', discountPercentage: 20, probability: 5 },
      { label: '5% Off', discountPercentage: 5, probability: 40 },
      { label: 'Free Gift', discountPercentage: 0, probability: 25 },
    ]
  });

  const tenantCoupons = coupons; // usually filter by tenantId, but here mock handles it globally or we can filter

  const handlePrizeChange = (index: number, field: keyof PrizeConfig, value: string | number) => {
    const newPrizes = [...(formData.prizes || [])];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setFormData({ ...formData, prizes: newPrizes });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.code) {
      addCoupon({ ...(formData as any), tenantId: tenantSettings.slug, status: 'ACTIVE' });
      setIsModalOpen(false);
      setFormData({ ...formData, name: '', code: '' });
    }
  };

  const totalProb = (formData.prizes || []).reduce((sum, p) => sum + Number(p.probability), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Promotions &amp; Coupons</h1>
          <p className="text-gray-500">Manage discount codes and special offers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Wheel &amp; Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-4">
            <Settings className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Lucky Wheel Status</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${luckyWheelActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {luckyWheelActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-sm text-gray-500">Allow users to spin the wheel for discounts before booking.</p>
          </div>
        </div>
        <button 
          onClick={() => setLuckyWheelActive(!luckyWheelActive)}
          className={`px-4 py-2 font-medium rounded-lg border ${luckyWheelActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
        >
          {luckyWheelActive ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2 text-gray-700 font-semibold text-lg">
        <Tag className="w-5 h-5 text-blue-600" />
        <h2>Active Coupons</h2>
      </div>

      <div className="space-y-4">
        {tenantCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{coupon.name}</h3>
                <div className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded mt-1 font-mono text-sm font-medium">
                  {coupon.code}
                </div>
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-xl font-bold text-gray-900 mb-1">{coupon.discountPercentage}% Off</div>
              <div className="flex items-center md:justify-end text-sm text-gray-500 gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{coupon.startDate || 'Anytime'} - {coupon.endDate || 'No expiry'}</span>
              </div>
            </div>
          </div>
        ))}
        {tenantCoupons.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active coupons available.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="couponForm" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Summer Sale" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" placeholder="E.G. SUMMER20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                  <input type="number" required value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-orange-600 font-semibold">
                    <Settings className="w-5 h-5" />
                    <span>Cấu hình Vòng quay (5 giải thưởng)</span>
                  </div>
                  <div className="space-y-3">
                    {formData.prizes?.map((prize, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input value={prize.label} onChange={e => handlePrizeChange(idx, 'label', e.target.value)} className="flex-2 px-3 py-2 border border-gray-300 rounded-lg text-sm w-1/2" placeholder="Label" />
                        <div className="flex items-center gap-1 w-1/4">
                          <Percent className="w-4 h-4 text-gray-400" />
                          <input type="number" value={prize.discountPercentage} onChange={e => handlePrizeChange(idx, 'discountPercentage', Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="%" />
                        </div>
                        <div className="flex items-center gap-1 w-1/4">
                          <span className="text-xs text-gray-500">Prob</span>
                          <input type="number" value={prize.probability} onChange={e => handlePrizeChange(idx, 'probability', Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Prob %" />
                        </div>
                      </div>
                    ))}
                    {totalProb !== 100 && (
                      <p className="text-xs text-red-500 italic mt-1">* Tổng tỷ lệ (Prob) phải bằng 100% (Hiện tại: {totalProb}%)</p>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white">
                Cancel
              </button>
              <button form="couponForm" type="submit" disabled={totalProb !== 100} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Save &amp; Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
