export interface Product {
  id?: number;
  name: string;
  unit: 'শলাকা' | 'পিচ';
  lowStockLimit: number;
  order?: number;
}

export interface OpeningStock {
  id?: number;
  productId: number;
  date: string;
  quantity: number;
  note?: string;
}

export interface Receive {
  id?: number;
  productId: number;
  date: string;
  invoiceNumber: string;
  quantity: number;
  freeQuantity?: number;
  supplier: string;
  note?: string;
}

export interface Sale {
  id?: number;
  productId: number;
  outletId?: number; // If set, it's a distribution to an outlet
  date: string;
  customerName: string;
  quantity: number;
  freeQuantity?: number;
  price?: number;
  paymentType?: 'নগদ' | 'বাকি';
  note?: string;
}

export interface Return {
  id?: number;
  productId: number;
  date: string;
  outletId: number;
  quantity: number;
  note?: string;
}

export interface OutletSale {
  id?: number;
  productId: number;
  outletId: number;
  date: string;
  quantity: number;
  freeQuantity?: number;
  price?: number;
  note?: string;
}

export interface Damage {
  id?: number;
  productId: number;
  outletId?: number; // If null, it's Godown damage
  date: string;
  quantity: number;
  note?: string;
}

export interface ReconciliationRecord {
  id?: number;
  productId: number;
  date: string;
  physicalQuantity: number;
  damageQuantity: number;
  dharaQuantity: number;
  difference: number;
  note?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone?: string;
}

export interface Outlet {
  id?: number;
  name: string;
  address?: string;
  order?: number;
}
