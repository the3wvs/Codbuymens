import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  LogOut,
  Users,
  Search,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { logout } from '../lib/firebase';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart },
    { id: 'inventory', label: 'المخزون', icon: Package },
    { id: 'history', label: 'سجل المبيعات', icon: History },
  ];

  if (profile?.role === 'admin') {
    // Admin specific items could go here
  }

  return (
    <div className="w-56 bg-slate-900 text-white h-screen fixed right-0 top-0 flex flex-col z-50 transition-all font-sans">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-lg shadow-sm">
          S
        </div>
        <h1 className="text-lg font-bold tracking-tight">سيستم بيع</h1>
      </div>

      <nav className="flex-1 mt-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-150 group text-right",
              currentView === item.id 
                ? "bg-blue-600 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              currentView === item.id ? "text-white" : "text-slate-500 group-hover:text-blue-400"
            )} />
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-[0.05em]">المستخدم الحالي</div>
        <div className="flex items-center gap-3 mb-4 p-2 rounded bg-slate-800/40">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-blue-400 font-bold border border-slate-600 text-xs">
            {profile?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-200">{profile?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{profile?.role === 'admin' ? 'مدير النظام' : 'موظف'}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded transition-colors group"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold text-[11px]">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};
