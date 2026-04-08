import { gql } from './gql';

export interface PosCategory {
  id: string;
  name: string;
}

export interface PosProduct {
  id: string;
  categoryId: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  quantityStr: string;
  img: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  pendingBalance: number;
}

export interface SaleTransactionInput {
  customerId?: string;
  items: { productId: string; qty: number; price: number; discount: number }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentMode: string;
}

// ----------------------------------------------------
// IQUERY IMPLEMENTATION (Admin API - auth handled by gql.ts)
// ----------------------------------------------------

export class GetPosCategoriesQuery {
  async execute(): Promise<PosCategory[]> {
    try {

      const data = await gql(`
        query GetCategories {
          collections { items { id name } }
        }
      `, { useAdmin: true });
      return data.collections.items;
    } catch {
      return [{ id: 'mock-1', name: 'General' }];
    }
  }
}

export class GetPosProductsQuery {
  async execute(categoryId?: string): Promise<PosProduct[]> {
    try {


      if (categoryId) {
        // Fetch products by collection — show each variant as separate row
        const data = await gql(`
          query GetCollection($id: ID!) {
            collection(id: $id) {
              productVariants(options: { take: 500 }) {
                totalItems
                items {
                  id name price sku stockLevel
                  product { id name }
                }
              }
            }
          }
        `, { useAdmin: true, variables: { id: categoryId } });

        if (data.collection?.productVariants?.items) {
          return data.collection.productVariants.items.map((v: any) => {
            const variantName = v.name || '';
            const productName = v.product.name || '';
            // Extract quantity from variant name (e.g., "Beetroot 250g" → "250g")
            const qty = variantName.replace(productName, '').trim() || '1 Pc';
            return {
              id: v.id, // Use variant ID so each variant is unique
              name: productName,
              categoryId: categoryId,
              barcode: v.sku || v.id,
              price: (v.price || 0) / 100,
              stock: v.stockLevel === 'IN_STOCK' ? 100 : 0,
              quantityStr: qty,
              img: ''
            };
          });
        }
      }

      // Fetch products from all supermarket collections (11-20)
      const collectionIds = ['11','12','13','14','15','16','17','18','19','20'];
      const allProducts: PosProduct[] = [];
      const seen = new Set<string>();

      for (const cid of collectionIds) {
        try {
          const cdata = await gql(`
            query GetCollection($id: ID!) {
              collection(id: $id) {
                name
                productVariants(options: { take: 500 }) {
                  totalItems
                  items {
                    id name price sku stockLevel
                    product { id name }
                  }
                }
              }
            }
          `, { useAdmin: true, variables: { id: cid } });

          const catName = cdata.collection?.name || 'General';
          (cdata.collection?.productVariants?.items || []).forEach((v: any) => {
            if (seen.has(v.id)) return;
            seen.add(v.id);
            const variantName = v.name || '';
            const productName = v.product.name || '';
            const qty = variantName.replace(productName, '').trim() || '1 Pc';
            allProducts.push({
              id: v.id,
              name: productName,
              categoryId: catName,
              barcode: v.sku || v.id,
              price: (v.price || 0) / 100,
              stock: v.stockLevel === 'IN_STOCK' ? 100 : 0,
              quantityStr: qty,
              img: ''
            });
          });
        } catch { /* skip failed collections */ }
      }
      return allProducts;
    } catch {
       // Mock Data Fallback
       const mockCategories = ['Produce', 'Dairy', 'Snacks', 'Drinks'];
       const produceItems = ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Tomato', 'Potato', 'Onion', 'Carrot', 'Spinach'];
       const dairyItems = ['Milk 1L', 'Butter', 'Cheese', 'Yogurt', 'Paneer', 'Ghee', 'Cream', 'Buttermilk', 'Egg 6pk', 'Condensed Milk'];
       const snacksItems = ['Chips', 'Popcorn', 'Biscuits', 'Chocolate Bar', 'Cookies', 'Peanuts', 'Cashews', 'Nachos', 'Pretzels', 'Muffin'];
       const drinkItems = ['Cola', 'Sparkling Water', 'Orange Juice', 'Apple Juice', 'Coffee', 'Green Tea', 'Energy Drink', 'Beer', 'Wine', 'Lemonade'];

       const allMocks: PosProduct[] = [];

       const generate = (names: string[], cat: string, basePrice: number) => {
         names.forEach((name, i) => {
           allMocks.push({
             id: `${cat.slice(0, 3).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
             categoryId: cat,
             barcode: `890${cat.length}${i.toString().padStart(3, '0')}`,
             name: `${name} (${cat === 'Produce' ? 'Fresh' : 'Premium'})`,
             price: basePrice + (i * 2.5),
             stock: 50 + (i * 5),
             quantityStr: cat === 'Produce' ? '1 Kg' : '1 Pc',
             img: ''
           });
         });
       };

       generate(produceItems, 'Produce', 25);
       generate(dairyItems, 'Dairy', 45);
       generate(snacksItems, 'Snacks', 15);
       generate(drinkItems, 'Drinks', 20);

       return allMocks;
    }
  }
}

export class LookupBarcodeQuery {
  async execute(barcodeOrSku: string): Promise<PosProduct | null> {
    const products = await new GetPosProductsQuery().execute();
    const s = barcodeOrSku.toLowerCase();
    return products.find(p => p.barcode === barcodeOrSku || p.id.toLowerCase() === s || p.name.toLowerCase().includes(s)) || null;
  }
}

export class GetPosCustomersQuery {
  async execute(): Promise<PosCustomer[]> {
    try {

      const data = await gql(`
        query {
          customers {
            items { id firstName lastName emailAddress phoneNumber }
          }
        }
      `, { useAdmin: true });
      return data.customers.items.map((c: any) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim() || 'Walk-in Customer',
        phone: c.phoneNumber || '',
        creditLimit: 0,
        pendingBalance: 0
      }));
    } catch {
      return [{ id: 'CUST-001', name: 'Walk-in Customer', phone: '', creditLimit: 0, pendingBalance: 0 }];
    }
  }
}

export class CreateSaleTransactionCommand {
  async execute(input: SaleTransactionInput): Promise<{ success: boolean; invoiceId: string }> {
     return { success: true, invoiceId: 'INV-' + Date.now() };
  }
}
