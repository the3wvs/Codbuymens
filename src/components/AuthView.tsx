import React from 'react';
import { ShoppingCart, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export const AuthView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-100">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 flex flex-col items-center gap-8 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-3xl opacity-10 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 blur-3xl opacity-10 -ml-16 -mb-16" />

        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 transform transition-transform hover:rotate-0">
          <ShoppingCart className="text-white w-10 h-10" />
        </div>

        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">مرحباً بك</h1>
          <p className="text-slate-500 font-medium">سجل دخولك للبدء في إدارة مبيعاتك</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full group flex items-center justify-center gap-4 bg-white border-2 border-slate-100 py-4 px-6 rounded-2xl hover:border-indigo-600 hover:bg-slate-50 transition-all duration-300 active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
          <span className="text-slate-700 font-bold text-lg select-none">الدخول بواسطة جوجل</span>
        </button>

        <p className="text-xs text-slate-400 font-medium tracking-wide">تصميم وتقنيات متطورة</p>
      </div>
      
      <div className="mt-8 flex items-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
        <span>إدارة المخزون</span>
        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
        <span>نقاط البيع</span>
        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
        <span>تقارير مفصلة</span>
      </div>
    </div>
  );
};
