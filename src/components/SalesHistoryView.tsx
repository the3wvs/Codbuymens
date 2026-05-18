import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar,
  Eye,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Sale } from '../types';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

export const SalesHistoryView: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'sales'), 
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesArr: Sale[] = [];
      snapshot.forEach((doc) => {
        salesArr.push({ id: doc.id, ...doc.data() } as Sale);
      });
      setSales(salesArr);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sales`);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">سجل المبيعات</h2>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">عرض وتحليل تاريخ العمليات</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث برقم العملية..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="data-grid-header">رقم الفاتورة</th>
                <th className="data-grid-header">التاريخ والوقت</th>
                <th className="data-grid-header">الأصناف</th>
                <th className="data-grid-header text-left">الإجمالي</th>
                <th className="data-grid-header text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="data-grid-row">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono text-[11px] font-bold text-gray-600 uppercase tracking-tighter">INV-{sale.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[11px] font-medium text-gray-500">
                    {sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'PPpp', { locale: ar }) : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {sale.items.map((item, idx) => (
                        <span key={idx} className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                          item.priceType === 'wholesale' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
                        )}>
                          {item.name} (x{item.quantity})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-black text-gray-900 text-left">
                    {sale.total.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className="status-pill bg-blue-100 text-blue-700">ناجح</span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                    لا توجد عمليات مبيعات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
