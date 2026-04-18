import { gql } from './gql';
import { cachedFetch, invalidateCache } from './cache';

const TTL = 60_000; // 1 min cache

// ══════════════════════════════════════════════════════════════
// ITEMS
// ══════════════════════════════════════════════════════════════
const ITEM_FIELDS = `id createdAt updatedAt code itemName tamilName category groupName brand hsnCode barcode unit packingUnit size taxName mfr purchaseRate salesRate mrpRate costRate cRate rateA rateB rateC rateD lastPurchaseRate lastSaleRate gstPercent discount profitMargin incentivePct batchNo mfgDate expiryDate serialNo minStock maxStock minStkQty maxStkQty isWeightBased isExpiryEnabled allowExpiry sizesJson`;

export class ListItemsQuery {
    async execute() {
        return cachedFetch('pharma:items', async () => {
            const data = await gql(`query Items { pharmaItems { ${ITEM_FIELDS} } }`, { useAdmin: true });
            return (data.pharmaItems || []).map(i => ({ ...i, sizes: JSON.parse(i.sizesJson || '[]') }));
        }, TTL);
    }
}

export class CreateItemCommand {
    async execute(input) {
        const data = await gql(`mutation CreateItem($input: PharmaItemInput!) { createPharmaItem(input: $input) { ${ITEM_FIELDS} } }`, { useAdmin: true, variables: { input } });
        invalidateCache('pharma:items');
        return data.createPharmaItem;
    }
}

export class UpdateItemCommand {
    async execute(id, input) {
        const data = await gql(`mutation UpdateItem($id: ID!, $input: PharmaItemInput!) { updatePharmaItem(id: $id, input: $input) { ${ITEM_FIELDS} } }`, { useAdmin: true, variables: { id, input } });
        invalidateCache('pharma:items');
        return data.updatePharmaItem;
    }
}

export class DeleteItemCommand {
    async execute(id) {
        const data = await gql(`mutation DelItem($id: ID!) { deletePharmaItem(id: $id) }`, { useAdmin: true, variables: { id } });
        invalidateCache('pharma:items');
        return data.deletePharmaItem;
    }
}

// ══════════════════════════════════════════════════════════════
// PURCHASES
// ══════════════════════════════════════════════════════════════
const PURCHASE_FIELDS = `id createdAt updatedAt purNo purDate invNo invDate taxMode payType otherState supplier orderRef transMode address transportName rowsJson totalAmount totalDiscA totalTax netAmount`;

export class ListPurchasesQuery {
    async execute() {
        return cachedFetch('pharma:purchases', async () => {
            const data = await gql(`query Purchases { pharmaPurchases { ${PURCHASE_FIELDS} } }`, { useAdmin: true });
            return (data.pharmaPurchases || []).map(p => ({ ...p, rows: JSON.parse(p.rowsJson || '[]') }));
        }, TTL);
    }
}

export class CreatePurchaseCommand {
    async execute(input) {
        const data = await gql(`mutation CreatePurchase($input: PharmaPurchaseInput!) { createPharmaPurchase(input: $input) { ${PURCHASE_FIELDS} } }`, { useAdmin: true, variables: { input } });
        invalidateCache('pharma:purchases');
        return data.createPharmaPurchase;
    }
}

export class DeletePurchaseCommand {
    async execute(id) {
        const data = await gql(`mutation DelPurchase($id: ID!) { deletePharmaPurchase(id: $id) }`, { useAdmin: true, variables: { id } });
        invalidateCache('pharma:purchases');
        return data.deletePharmaPurchase;
    }
}

// ══════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════
const PAYMENT_FIELDS = `id createdAt updatedAt payNo payDate refNo payType otherState supplierName supplierGST orderRef transMode address chequeNo bankName narration rowsJson totalPaying totalDisc totalNet`;

export class ListPaymentsQuery {
    async execute() {
        return cachedFetch('pharma:payments', async () => {
            const data = await gql(`query Payments { pharmaPayments { ${PAYMENT_FIELDS} } }`, { useAdmin: true });
            return (data.pharmaPayments || []).map(p => ({ ...p, rows: JSON.parse(p.rowsJson || '[]') }));
        }, TTL);
    }
}

export class CreatePaymentCommand {
    async execute(input) {
        const data = await gql(`mutation CreatePay($input: PharmaPaymentInput!) { createPharmaPayment(input: $input) { ${PAYMENT_FIELDS} } }`, { useAdmin: true, variables: { input } });
        invalidateCache('pharma:payments');
        return data.createPharmaPayment;
    }
}

export class DeletePaymentCommand {
    async execute(id) {
        const data = await gql(`mutation DelPay($id: ID!) { deletePharmaPayment(id: $id) }`, { useAdmin: true, variables: { id } });
        invalidateCache('pharma:payments');
        return data.deletePharmaPayment;
    }
}

// ══════════════════════════════════════════════════════════════
// RECEIPTS
// ══════════════════════════════════════════════════════════════
const RECEIPT_FIELDS = `id createdAt updatedAt docNo docDate billRefNo docType refType accHead payMode narration1 narration2 cashDisc amount recAmount rowsJson`;

export class ListReceiptsQuery {
    async execute() {
        return cachedFetch('pharma:receipts', async () => {
            const data = await gql(`query Receipts { pharmaReceipts { ${RECEIPT_FIELDS} } }`, { useAdmin: true });
            return (data.pharmaReceipts || []).map(r => ({ ...r, rows: JSON.parse(r.rowsJson || '[]') }));
        }, TTL);
    }
}

export class CreateReceiptCommand {
    async execute(input) {
        const data = await gql(`mutation CreateRcpt($input: PharmaReceiptInput!) { createPharmaReceipt(input: $input) { ${RECEIPT_FIELDS} } }`, { useAdmin: true, variables: { input } });
        invalidateCache('pharma:receipts');
        return data.createPharmaReceipt;
    }
}

export class DeleteReceiptCommand {
    async execute(id) {
        const data = await gql(`mutation DelRcpt($id: ID!) { deletePharmaReceipt(id: $id) }`, { useAdmin: true, variables: { id } });
        invalidateCache('pharma:receipts');
        return data.deletePharmaReceipt;
    }
}

// ══════════════════════════════════════════════════════════════
// TOKENS
// ══════════════════════════════════════════════════════════════
const TOKEN_FIELDS = `id createdAt updatedAt tokenNo tokenDate tokenTime patientName address cellNo amount injAmt total`;

export class ListTokensQuery {
    async execute(tokenDate) {
        const key = tokenDate ? `pharma:tokens:${tokenDate}` : 'pharma:tokens';
        return cachedFetch(key, async () => {
            const data = await gql(`query Tokens($d: String) { pharmaTokens(tokenDate: $d) { ${TOKEN_FIELDS} } }`, { useAdmin: true, variables: { d: tokenDate || null } });
            return data.pharmaTokens || [];
        }, TTL);
    }
}

export class CreateTokenCommand {
    async execute(input) {
        const data = await gql(`mutation CreateTkn($input: PharmaTokenInput!) { createPharmaToken(input: $input) { ${TOKEN_FIELDS} } }`, { useAdmin: true, variables: { input } });
        invalidateCache('pharma:tokens');
        return data.createPharmaToken;
    }
}

export class DeleteTokenCommand {
    async execute(id) {
        const data = await gql(`mutation DelTkn($id: ID!) { deletePharmaToken(id: $id) }`, { useAdmin: true, variables: { id } });
        invalidateCache('pharma:tokens');
        return data.deletePharmaToken;
    }
}
