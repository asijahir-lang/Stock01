import Dexie, { type Table } from 'dexie';
import type { Product, OpeningStock, Receive, Sale, Return, Customer, Outlet, OutletSale, Damage, ReconciliationRecord } from './types';

export class StockDatabase extends Dexie {
  products!: Table<Product>;
  openingStocks!: Table<OpeningStock>;
  receives!: Table<Receive>;
  sales!: Table<Sale>;
  returns!: Table<Return>;
  outletSales!: Table<OutletSale>;
  damages!: Table<Damage>;
  reconciliations!: Table<ReconciliationRecord>;
  customers!: Table<Customer>;
  outlets!: Table<Outlet>;

  constructor() {
    super('StockManagementDB');
    this.version(7).stores({
      products: '++id, name, order',
      openingStocks: '++id, productId, date',
      receives: '++id, productId, date, invoiceNumber',
      sales: '++id, productId, date, customerName, note',
      returns: '++id, productId, date, outletId',
      outletSales: '++id, productId, date, outletId',
      damages: '++id, productId, date, outletId',
      reconciliations: '++id, productId, date',
      customers: '++id, name',
      outlets: '++id, name, order'
    });
  }
}

export const db = new StockDatabase();

// Initial data helper
export async function seedDatabase() {
  try {
    const productCount = await db.products.count();
    if (productCount === 0) {
      await db.products.bulkAdd([
        { name: 'আকিজ বিড়ি (২৫ শলাকা)', unit: 'শলাকা', lowStockLimit: 10, order: 0 },
        { name: 'আকিজ বিড়ি (১২ শলাকা)', unit: 'শলাকা', lowStockLimit: 10, order: 1 },
        { name: 'আকিজ বিড়ি (১০ শলাকা)', unit: 'শলাকা', lowStockLimit: 10, order: 2 },
      ]);
    }

    const outletCount = await db.outlets.count();
    if (outletCount === 0) {
      await db.outlets.bulkAdd([
        { name: 'মেইন আউটলেট (Main Outlet)', address: 'সদর রোড', order: 0 },
        { name: 'বাজার আউটলেট (Market Outlet)', address: 'নিউ মার্কেট', order: 1 },
      ]);
    }

    const customerCount = await db.customers.count();
    if (customerCount === 0) {
      await db.customers.bulkAdd([
        { name: 'নগদ ক্রেতা (Cash Customer)', phone: '' },
      ]);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  }
}
