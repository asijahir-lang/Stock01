import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { startOfDay, startOfMonth, endOfDay } from 'date-fns';

export function useStock() {
  const products = useLiveQuery(() => db.products.orderBy('order').toArray());
  const openingStocks = useLiveQuery(() => db.openingStocks.toArray());
  const receives = useLiveQuery(() => db.receives.toArray());
  const sales = useLiveQuery(() => db.sales.toArray());
  const returns = useLiveQuery(() => db.returns.toArray());
  const outletSales = useLiveQuery(() => db.outletSales.toArray());
  const damages = useLiveQuery(() => db.damages.toArray());
  const reconciliations = useLiveQuery(() => db.reconciliations.toArray());

  const getGodownStock = (productId: number, asOfDate?: string) => {
    const opening = (openingStocks || [])
      .filter(s => s.productId === productId)
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const received = (receives || [])
      .filter(r => r.productId === productId && (!asOfDate || r.date <= asOfDate))
      .reduce((sum, r) => sum + r.quantity, 0);

    const returned = (returns || [])
      .filter(r => r.productId === productId && (!asOfDate || r.date <= asOfDate))
      .reduce((sum, r) => sum + r.quantity, 0);
    
    const distributedOrSold = (sales || [])
      .filter(s => s.productId === productId && (!asOfDate || s.date <= asOfDate))
      .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

    const damaged = (damages || [])
      .filter(d => d.productId === productId && !d.outletId && (!asOfDate || d.date <= asOfDate))
      .reduce((sum, d) => sum + d.quantity, 0);

    const reconciliationDiff = (reconciliations || [])
      .filter(r => r.productId === productId && (!asOfDate || r.date.split('T')[0] <= asOfDate))
      .reduce((sum, r) => sum + (r.difference || 0), 0);
    
    return opening + received + returned - distributedOrSold - damaged + reconciliationDiff;
  };

  const getOutletStock = (productId: number, outletId?: number, asOfDate?: string) => {
    const distributed = (sales || [])
      .filter(s => s.productId === productId && (outletId ? s.outletId === outletId : !!s.outletId) && (!asOfDate || s.date <= asOfDate))
      .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

    const returned = (returns || [])
      .filter(r => r.productId === productId && (outletId ? r.outletId === outletId : true) && (!asOfDate || r.date <= asOfDate))
      .reduce((sum, r) => sum + r.quantity, 0);

    const sold = (outletSales || [])
      .filter(s => s.productId === productId && (outletId ? s.outletId === outletId : true) && (!asOfDate || s.date <= asOfDate))
      .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

    const damaged = (damages || [])
      .filter(d => d.productId === productId && (outletId ? d.outletId === outletId : d.outletId) && (!asOfDate || d.date <= asOfDate))
      .reduce((sum, d) => sum + d.quantity, 0);

    return distributed - returned - sold - damaged;
  };

  const getProductStock = (productId: number, asOfDate?: string) => {
    const godown = getGodownStock(productId, asOfDate);
    const outletsStock = (products || []).length > 0 ? getOutletStock(productId, undefined, asOfDate) : 0;
    return godown + outletsStock;
  };

  const totalStock = (products || []).reduce((sum, p) => sum + getProductStock(p.id!), 0);

  const today = new Date();
  const todayDirectSales = (sales || [])
    .filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfDay(today) && saleDate <= endOfDay(today) && s.note !== 'Outlet Distribution';
    })
    .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const todayOutletSales = (outletSales || [])
    .filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfDay(today) && saleDate <= endOfDay(today);
    })
    .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const todaySales = todayDirectSales + todayOutletSales;

  const todayDistribution = (sales || [])
    .filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfDay(today) && saleDate <= endOfDay(today) && s.note === 'Outlet Distribution';
    })
    .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const monthlySales = (sales || [])
    .filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfMonth(today) && s.note !== 'Outlet Distribution';
    })
    .reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const lowStockProducts = (products || []).filter(p => {
    const stock = getProductStock(p.id!);
    return stock <= p.lowStockLimit;
  });

  return {
    products: products || [],
    getGodownStock,
    getOutletStock,
    getProductStock,
    totalStock,
    todaySales,
    todayDistribution,
    monthlySales,
    lowStockProducts,
    sales: sales || [],
    outletSales: outletSales || [],
    isLoading: products === undefined || openingStocks === undefined || receives === undefined || sales === undefined || returns === undefined || outletSales === undefined || damages === undefined || reconciliations === undefined
  };
}
