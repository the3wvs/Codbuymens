import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { Sale, Product } from '../types';
import { cn } from '../lib/utils';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    salesCount: 0,
    productCount: 0,
    lowStockCount: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!user) return;

    // Total Sales & Count
    const unsubscribeSales = onSnapshot(collection(db, 'users', user.uid, 'sales'), (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += (doc.data() as any).total || 0;
      });
      setStats(prev => ({ ...prev, totalSales: total, salesCount: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sales`);
    });

    // Product Count & Low Stock
    const unsubscribeProducts = onSnapshot(collection(db, 'users', user.uid, 'products'), (snapshot) => {
      let lowStock = 0;
      snapshot.forEach(doc => {
        if ((doc.data() as any).stock <= 5) lowStock++;
      });
      setStats(prev => ({ ...prev, productCount: snapshot.size, lowStockCount: lowStock }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/products`);
    });

    // Recent Sales
    const qRecent = query(collection(db, 'users', user.uid, 'sales'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      const sales: Sale[] = [];
      snapshot.forEach(doc => {
        sales.push({ id: doc.id, ...doc.data() } as Sale);
      });
      setRecentSales(sales);
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sales_recent`);
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeRecent();
    };
  }, [user]);

  const cards = [
    { label: 'إجمالي المبيعات', value: `${stats.totalSales.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-blue-600', trend: '+12.5%', isPositive: true },
    { label: 'عدد فواتير اليوم', value: stats.salesCount.toLocaleString(), icon: ShoppingCart, color: 'text-gray-900', trend: 'متوسط 445 ج.م', isPositive: true },
    { label: 'نقص المخزون', value: stats.lowStockCount.toLocaleString(), icon: Clock, color: 'text-orange-700', trend: 'إعادة طلب', isPositive: false, highlight: stats.lowStockCount > 0 },
    { label: 'إجمالي المنتجات', value: stats.productCount.toLocaleString(), icon: Package, color: 'text-blue-600', trend: 'متوفر', isPositive: true },
  ];

  return (
    <div className="p-6 flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className={cn(
            "stat-card relative overflow-hidden transition-all hover:border-blue-300",
            card.highlight ? "bg-orange-50 border-orange-200" : ""
          )}>
            <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">{card.label}</div>
            <div className={cn("text-2xl font-black mb-1", card.color)}>
              {card.value}
            </div>
            <div className={cn(
              "text-[10px] font-bold",
              card.isPositive ? "text-green-600" : "text-orange-600"
            )}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Recent Transactions List (High Density) */}
        <div className="flex-[2] bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-xs text-gray-800 uppercase tracking-tight">آخر فواتير المبيعات</h2>
            <button className="text-[11px] text-blue-600 cursor-pointer font-bold uppercase hover:underline">عرض الكل</button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="data-grid-header">رقم الفاتورة</th>
                  <th className="data-grid-header">الأصناف</th>
                  <th className="data-grid-header text-left">الإجمالي</th>
                  <th className="data-grid-header text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="data-grid-row">
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-600">#{sale.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">{sale.items.length} أصناف</td>
                    <td className="px-3 py-2 font-black text-left text-gray-900">{sale.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="status-pill bg-green-100 text-green-700">مدفوع</span>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                      لا توجد عمليات مبيعات مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Actions & Metrics */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-3">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-gray-50 p-2.5 rounded text-[11px] font-bold text-center hover:bg-blue-600 hover:text-white transition-all border border-gray-100">جرد سريع</button>
              <button className="bg-gray-50 p-2.5 rounded text-[11px] font-bold text-center hover:bg-blue-600 hover:text-white transition-all border border-gray-100">تقرير يومي</button>
              <button className="bg-gray-50 p-2.5 rounded text-[11px] font-bold text-center hover:bg-blue-600 hover:text-white transition-all border border-gray-100">إضافة منتج</button>
              <button className="bg-gray-50 p-2.5 rounded text-[11px] font-bold text-center hover:bg-blue-600 hover:text-white transition-all border border-gray-100">عرض ديون</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-lg relative overflow-hidden group">
            <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">تنبيه المخزون</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              هناك {stats.lowStockCount} منتجات قاربت على النفاد. يرجى مراجعة المخزون لإضافة طلبات جديدة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
