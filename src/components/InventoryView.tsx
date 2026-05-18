import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Package, 
  ArrowRightLeft, 
  AlertTriangle,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { Product } from '../types';
import { cn } from '../lib/utils';

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formWholesalePrice, setFormWholesalePrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formBarcode, setFormBarcode] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/products`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formName,
      price: parseFloat(formPrice),
      wholesalePrice: parseFloat(formWholesalePrice),
      stock: parseInt(formStock),
      barcode: formBarcode,
      updatedAt: serverTimestamp(),
    };

    if (!user) return;

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'users', user.uid, 'products', editingProduct.id), data);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/products`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/products/${id}`);
      }
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormPrice(product.price.toString());
      setFormWholesalePrice((product.wholesalePrice || 0).toString());
      setFormStock(product.stock.toString());
      setFormBarcode(product.barcode || '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormPrice('');
      setFormWholesalePrice('');
      setFormStock('');
      setFormBarcode('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">المخزن</h2>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">إدارة المنتجات وكمياتها</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all shadow-sm font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث السريع..." 
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
                <th className="data-grid-header">المنتج</th>
                <th className="data-grid-header">الباركود</th>
                <th className="data-grid-header text-center">سعر البيع</th>
                <th className="data-grid-header text-center">سعر الجملة</th>
                <th className="data-grid-header">الكمية</th>
                <th className="data-grid-header text-center">الحالة</th>
                <th className="data-grid-header text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="data-grid-row">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center text-blue-600">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-gray-800">{product.name}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500 font-mono tracking-tighter">{product.barcode || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-black text-gray-900 text-center">{product.price.toLocaleString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-black text-blue-600 text-center">{product.wholesalePrice?.toLocaleString() || '0'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-800">{product.stock}</span>
                      {product.stock <= 5 && (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className={cn(
                      "status-pill",
                      product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {product.stock > 0 ? 'متوفر' : 'منفذ'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openModal(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                    لا توجد منتجات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600">اسم المنتج</label>
                <input 
                  required
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="مثال: مشروبات غازية"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600">سعر البيع</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600">سعر الجملة</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formWholesalePrice}
                    onChange={(e) => setFormWholesalePrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600">الكمية</label>
                <input 
                  required
                  type="number" 
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600">الباركود (اختياري)</label>
                <input 
                  type="text" 
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium font-mono"
                  placeholder="123456789"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-4"
              >
                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
