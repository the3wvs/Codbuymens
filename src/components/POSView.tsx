import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  Package,
  Receipt,
  Printer,
  Share2,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { Product, SaleItem, Sale } from '../types';
import { cn } from '../lib/utils';
import { Invoice } from './Invoice';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

export const POSView: React.FC = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Partial<Sale> | null>(null);
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/products`);
    });

    return () => unsubscribe();
  }, [user]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    const priceToUse = priceType === 'wholesale' ? (product.wholesalePrice || product.price) : product.price;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.priceType === priceType);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          (item.productId === product.id && item.priceType === priceType)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: priceToUse, 
        quantity: 1,
        priceType: priceType
      }];
    });
  };

  const removeFromCart = (productId: string, type: 'retail' | 'wholesale') => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.priceType === type)));
  };

  const updateQuantity = (productId: string, type: 'retail' | 'wholesale', delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.priceType === type) {
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing || !user) return;
    setIsProcessing(true);

    const saleData = {
      items: cart,
      total: totalPrice,
      timestamp: serverTimestamp(),
      userId: user.uid,
      customerName: 'Guest'
    };

    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(collection(db, 'users', user.uid, 'sales'));
        transaction.set(saleRef, saleData);

        for (const item of cart) {
          const productRef = doc(db, 'users', user.uid, 'products', item.productId);
          transaction.update(productRef, {
            stock: increment(-item.quantity)
          });
        }
      });

      setLastSale(saleData);
      setCart([]);
      setShowSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales/transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareAsImage = async () => {
    if (invoiceRef.current === null) return;
    
    try {
      const dataUrl = await toPng(invoiceRef.current, { cacheBust: true });
      download(dataUrl, `invoice-${Date.now()}.png`);
    } catch (err) {
      console.error('Error sharing image:', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-300">
      {/* Print Overlay - ONLY visible when printing */}
      <div className="hidden print:block fixed inset-0 bg-white z-[100] h-full w-full p-0 overflow-visible">
        {lastSale && <Invoice sale={lastSale} />}
      </div>

      {/* Search & Products Grid */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="بحث سريع عن منتج (الاسم أو الباركود)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-md p-1 shadow-sm shrink-0">
            <button 
              onClick={() => setPriceType('retail')}
              className={cn(
                "px-4 py-1.5 rounded text-[11px] font-black transition-all",
                priceType === 'retail' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              قطاعي
            </button>
            <button 
              onClick={() => setPriceType('wholesale')}
              className={cn(
                "px-4 py-1.5 rounded text-[11px] font-black transition-all",
                priceType === 'wholesale' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              جملة
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                disabled={product.stock <= 0}
                onClick={() => addToCart(product)}
                className={cn(
                  "bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all text-right flex flex-col gap-1.5 group active:scale-[0.98] disabled:opacity-40 disabled:grayscale",
                  product.stock > 0 ? "hover:border-blue-300" : ""
                )}
              >
                <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-blue-600 group-hover:bg-blue-50 transition-colors">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-xs line-clamp-1">{product.name}</h4>
                  <p className="text-blue-600 font-black text-sm mt-0.5">
                    {priceType === 'retail' ? product.price.toLocaleString() : (product.wholesalePrice || product.price).toLocaleString()} ج.م
                  </p>
                </div>
                <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    product.stock > 10 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {product.stock} ق
                  </span>
                  <Plus className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Cart Section */}
      <div className="w-full lg:w-80 flex flex-col gap-4 print:hidden">
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden border border-gray-200">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">سلة المبيعات</h3>
            </div>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">{cart.length} أصناف</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {cart.map((item, idx) => (
              <div key={`${item.productId}-${item.priceType}`} className="flex flex-col gap-1 p-2 bg-gray-50/50 rounded hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-gray-800 text-[11px] truncate flex-1">{item.name}</h5>
                  <span className={cn(
                    "px-1 rounded text-[8px] font-black uppercase",
                    item.priceType === 'wholesale' ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                  )}>
                    {item.priceType === 'wholesale' ? 'جملة' : 'قطاعي'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 font-bold">{item.price.toLocaleString()} ج.م</p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white rounded border border-gray-100 p-0.5 shadow-xs">
                    <button onClick={() => updateQuantity(item.productId, item.priceType, -1)} className="p-0.5 hover:text-blue-600"><Minus className="w-2.5 h-2.5" /></button>
                    <span className="font-bold text-[10px] w-3 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.priceType, 1)} className="p-0.5 hover:text-blue-600"><Plus className="w-2.5 h-2.5" /></button>
                  </div>

                  <div className="text-left min-w-[50px]">
                    <p className="font-black text-gray-900 text-[11px]">{(item.price * item.quantity).toLocaleString()}</p>
                  </div>

                  <button onClick={() => removeFromCart(item.productId, item.priceType)} className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 py-10">
                <ShoppingCart className="w-10 h-10 opacity-10" />
                <p className="font-bold text-[10px] uppercase tracking-widest">السلة فارغة</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase">
              <span>المجموع</span>
              <span>{totalPrice.toLocaleString()} ج.م</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 pt-2 border-t border-gray-200">
              <span className="text-sm font-black uppercase">الإجمالي النهائي</span>
              <span className="text-xl font-black text-blue-600">{totalPrice.toLocaleString()}</span>
            </div>

            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className={cn(
                "w-full py-3 rounded-md text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:grayscale",
                isProcessing ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isProcessing ? 'جاري الحفظ...' : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>إصدار الفاتورة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" />
          <div className="relative bg-white rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300 max-w-md w-full overflow-hidden">
            <button 
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">تمت العملية بنجاح</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">تم تحديث المخزون وحفظ الفاتورة</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-lg font-black text-xs hover:bg-gray-200 transition-all border border-gray-200"
              >
                <Printer className="w-4 h-4" /> الطباعة
              </button>
              <button 
                onClick={handleShareAsImage}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-black text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              >
                <Share2 className="w-4 h-4" /> مشاركة صورة
              </button>
            </div>

            {/* Hidden invoice for image generation */}
            <div className="fixed left-[-9999px] top-0 overflow-hidden">
              <div ref={invoiceRef}>
                {lastSale && <Invoice sale={lastSale} />}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-bold italic">يمكنك إغلاق هذه النافذة بعد إتمام الطباعة</p>
          </div>
        </div>
      )}
    </div>
  );
};
