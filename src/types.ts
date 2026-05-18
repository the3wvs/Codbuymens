export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  category: string;
  barcode?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  name: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  priceType: 'retail' | 'wholesale';
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  timestamp: any;
  userId: string;
  customerName?: string;
}
