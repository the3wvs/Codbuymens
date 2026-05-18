import React from 'react';
import { Sale } from '../types';
import { format } from 'date-fns';

interface InvoiceProps {
  sale: Partial<Sale>;
}

export const Invoice: React.FC<InvoiceProps> = ({ sale }) => {
  const getTimestamp = () => {
    if (!sale.timestamp) return new Date();
    if (typeof (sale.timestamp as any).toDate === 'function') {
      return (sale.timestamp as any).toDate();
    }
    return new Date();
  };

  const dateStr = format(getTimestamp(), 'yyyy/MM/dd HH:mm');

  return (
    <div className="bg-white text-black p-10 mx-auto w-[420px] font-sans selection:bg-blue-50 shadow-2xl" id="invoice-bill" style={{ direction: 'rtl' }}>
      {/* Premium Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">نظام المبيعات المطور</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">High Performance Sales System</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded">فاتورة ضريبية</span>
            <span className="text-[9px] text-slate-400 font-mono">#{sale.id?.slice(-8) || 'DRAFT'}</span>
          </div>
        </div>
        <div className="bg-slate-100 p-2 rounded-lg">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`INV-${sale.id || 'TEMP'}-${sale.total || 0}`)}&size=80x80`}
            alt="QR Code"
            className="w-16 h-16 opacity-80"
          />
        </div>
      </div>

      {/* Info Bar */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">بيانات العميل</p>
            <p className="text-xs font-black text-slate-800">{sale.customerName || 'عميل نقدي عابر'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">طريقة الدفع</p>
            <p className="text-xs font-black text-slate-800">نقدي / كاش</p>
          </div>
        </div>
        <div className="space-y-4 text-left">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">التاريخ</p>
            <p className="text-xs font-black text-slate-800">{dateStr.split(' ')[0]}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الوقت</p>
            <p className="text-xs font-black text-slate-800">{dateStr.split(' ')[1]}</p>
          </div>
        </div>
      </div>

      {/* Modern Items Table */}
      <div className="mb-10">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">المنتج</th>
              <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الكمية</th>
              <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sale.items?.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="py-4">
                  <p className="text-xs font-black text-slate-800">{item.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {item.price.toLocaleString()} ج.م / وحدة
                    {item.priceType === 'wholesale' && (
                      <span className="mr-2 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">سعر جملة</span>
                    )}
                  </p>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-block bg-slate-50 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600">
                    x{item.quantity}
                  </span>
                </td>
                <td className="py-4 text-left">
                  <p className="text-xs font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} <span className="text-[9px] opacity-40">ج.م</span></p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Financial Table */}
      <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
        <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
          <p>المجموع الفرعي</p>
          <p>{sale.total?.toLocaleString()} ج.م</p>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
          <p>ضريبة القيمة المضافة (0%)</p>
          <p>0.00 ج.م</p>
        </div>
        <div className="h-px bg-slate-200 my-2" />
        <div className="flex justify-between items-center">
          <p className="text-xs font-black text-slate-900">الإجمالي المستحق</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">
            {sale.total?.toLocaleString()} <span className="text-xs font-bold text-slate-400 mr-1">EGP</span>
          </p>
        </div>
      </div>

      {/* Branding Footer */}
      <div className="mt-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full h-1 bg-slate-100 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-shimmer" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800">نقدر زيارتكم لنا دائماً</p>
            <p className="text-[9px] text-slate-400 font-bold max-w-[200px] mx-auto leading-relaxed">
              هذه الفاتورة تم إنشاؤها عبر النظام المطور للمبيعات الرقمية. جميع الحقوق محفوظة.
            </p>
          </div>
          <div className="mt-4 flex gap-1 font-mono text-[8px] text-slate-300 select-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i}>|</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
