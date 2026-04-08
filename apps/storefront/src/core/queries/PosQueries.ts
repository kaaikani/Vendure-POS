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
  async execute(payload: any): Promise<{ success: boolean; invoiceId: string; orderId?: string; orderCode?: string; error?: string }> {
    const invoiceId = payload?.invoiceId || ('INV-' + Date.now());
    let orderId: string | undefined;
    let orderCode: string | undefined;

    try {
      // 1. Create draft order
      const createRes = await gql(`
        mutation { createDraftOrder { id code state } }
      `, { useAdmin: true });
      orderId = createRes.createDraftOrder.id;
      orderCode = createRes.createDraftOrder.code;

      // 2. Add each cart item to the draft order
      const items = payload?.items || [];
      for (const item of items) {
        const res = await gql(`
          mutation AddItem($orderId: ID!, $input: AddItemToDraftOrderInput!) {
            addItemToDraftOrder(orderId: $orderId, input: $input) {
              ... on Order { id }
              ... on ErrorResult { errorCode message }
            }
          }
        `, {
          useAdmin: true,
          variables: {
            orderId,
            input: {
              productVariantId: item.id,
              quantity: item.qty || 1,
            },
          },
        });
        if (res?.addItemToDraftOrder?.errorCode) {
          console.warn('addItemToDraftOrder failed:', res.addItemToDraftOrder);
        }
      }

      // 3. Set customer (if provided)
      const customer = payload?.customer || {};
      const isWalkIn = !customer.name || customer.name === 'Walk-in Customer';
      if (!isWalkIn) {
        const parts = String(customer.name).trim().split(/\s+/);
        const firstName = parts[0] || 'Walk-in';
        const lastName = parts.slice(1).join(' ') || 'Customer';
        const safePhone = (customer.phone || 'walkin').toString().replace(/\D/g, '') || 'walkin';
        const email = `${safePhone}@pos.local`;
        try {
          await gql(`
            mutation SetCustomer($orderId: ID!, $input: CreateCustomerInput!) {
              setCustomerForDraftOrder(orderId: $orderId, input: $input) {
                ... on Order { id }
                ... on ErrorResult { errorCode message }
              }
            }
          `, {
            useAdmin: true,
            variables: {
              orderId,
              input: {
                firstName,
                lastName,
                emailAddress: email,
                phoneNumber: customer.phone || '',
              },
            },
          });
        } catch (e) { console.warn('setCustomerForDraftOrder failed:', e); }
      }

      // 4. Set shipping address (required for state transition)
      try {
        await gql(`
          mutation SetAddr($orderId: ID!, $input: CreateAddressInput!) {
            setDraftOrderShippingAddress(orderId: $orderId, input: $input) {
              ... on Order { id }
            }
          }
        `, {
          useAdmin: true,
          variables: {
            orderId,
            input: {
              fullName: customer.name || 'Walk-in Customer',
              streetLine1: customer.address || 'POS Walk-in',
              city: 'Store',
              postalCode: '000000',
              countryCode: 'IN',
              phoneNumber: customer.phone || '',
            },
          },
        });

        await gql(`
          mutation SetBillAddr($orderId: ID!, $input: CreateAddressInput!) {
            setDraftOrderBillingAddress(orderId: $orderId, input: $input) {
              ... on Order { id }
            }
          }
        `, {
          useAdmin: true,
          variables: {
            orderId,
            input: {
              fullName: customer.name || 'Walk-in Customer',
              streetLine1: customer.address || 'POS Walk-in',
              city: 'Store',
              postalCode: '000000',
              countryCode: 'IN',
              phoneNumber: customer.phone || '',
            },
          },
        });
      } catch (e) { console.warn('Set address failed:', e); }

      // 5. Pick first eligible shipping method and set it
      try {
        const smRes = await gql(`
          query EligibleShipping($orderId: ID!) {
            eligibleShippingMethodsForDraftOrder(orderId: $orderId) { id price name }
          }
        `, { useAdmin: true, variables: { orderId } });
        const methods = smRes?.eligibleShippingMethodsForDraftOrder || [];
        if (methods.length > 0) {
          await gql(`
            mutation SetSM($orderId: ID!, $smId: ID!) {
              setDraftOrderShippingMethod(orderId: $orderId, shippingMethodId: $smId) {
                ... on Order { id }
                ... on ErrorResult { errorCode message }
              }
            }
          `, { useAdmin: true, variables: { orderId, smId: methods[0].id } });
        }
      } catch (e) { console.warn('Set shipping method failed:', e); }

      // 6. Transition order to ArrangingPayment
      try {
        const tRes = await gql(`
          mutation Transition($id: ID!) {
            transitionOrderToState(id: $id, state: "ArrangingPayment") {
              ... on Order { id state }
              ... on OrderStateTransitionError { errorCode message transitionError }
            }
          }
        `, { useAdmin: true, variables: { id: orderId } });

        if (tRes?.transitionOrderToState?.state === 'ArrangingPayment') {
          // 7. Add manual payment to settle the order
          const payRes = await gql(`
            mutation Pay($input: ManualPaymentInput!) {
              addManualPaymentToOrder(input: $input) {
                ... on Order { id state }
                ... on ErrorResult { errorCode message }
              }
            }
          `, {
            useAdmin: true,
            variables: {
              input: {
                orderId,
                method: 'standard-payment',
                transactionId: invoiceId,
                metadata: {
                  paymentMode: payload?.saleType || 'OFFLINE',
                  receivedAmount: payload?.receivedAmount || 0,
                  posInvoiceId: invoiceId,
                },
              },
            },
          });
          if (payRes?.addManualPaymentToOrder?.errorCode) {
            console.warn('addManualPaymentToOrder failed:', payRes.addManualPaymentToOrder);
          }
        } else {
          console.warn('transitionOrderToState failed:', tRes?.transitionOrderToState);
        }
      } catch (e) { console.warn('Order transition / payment failed:', e); }

      return { success: true, invoiceId, orderId, orderCode };
    } catch (err: any) {
      console.error('CreateSaleTransactionCommand failed:', err);
      return { success: false, invoiceId, orderId, orderCode, error: err?.message || 'Unknown error' };
    }
  }
}
