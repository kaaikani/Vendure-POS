import { gql } from './gql';

export interface LedgerPayment {
  id: string;
  createdAt: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CREDIT';
}

export interface Ledger {
  id: string;
  type: 'SUPPLIER' | 'CUSTOMER';
  partyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  creditDays: number;
  payments: LedgerPayment[];
}

export interface LedgerSummary {
  totalSales: number;
  totalPurchase: number;
  totalReceivable: number;
  totalPayable: number;
}

// 1. getLedgers
export class GetLedgersQuery {
  async execute(type: 'CUSTOMER' | 'SUPPLIER'): Promise<Ledger[]> {
    const data = await gql(`
      query Ledgers($type: LedgerType!) {
        ledgers(type: $type) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays
          payments { id createdAt amount paymentDate paymentMode }
        }
      }
    `, { useAdmin: true, variables: { type } });
    return data.ledgers;
  }
}

// 2. getLedgerById
export class GetLedgerByIdQuery {
  async execute(id: string): Promise<Ledger | null> {
    const data = await gql(`
      query Ledger($id: ID!) {
        ledger(id: $id) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays
          payments { id createdAt amount paymentDate paymentMode }
        }
      }
    `, { useAdmin: true, variables: { id } });
    return data.ledger;
  }
}

// 3. summary
export class GetLedgerSummaryQuery {
  async execute(): Promise<LedgerSummary> {
    const data = await gql(`
      query LedgerSummary {
        ledgerSummary { totalSales totalPurchase totalReceivable totalPayable }
      }
    `, { useAdmin: true });
    return data.ledgerSummary;
  }
}

// 4. addPayment
export interface AddPaymentInput {
  amount: number;
  paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CREDIT';
  paymentDate: string;
}

export class AddPaymentCommand {
  async execute(ledgerId: string, input: AddPaymentInput): Promise<Ledger> {
    const data = await gql(`
      mutation AddPayment($ledgerId: ID!, $input: PaymentInput!) {
        addPayment(ledgerId: $ledgerId, input: $input) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays
          payments { id createdAt amount paymentDate paymentMode }
        }
      }
    `, { 
      useAdmin: true, 
      variables: { 
        ledgerId, 
        input: { 
          amount: input.amount, 
          paymentMode: input.paymentMode, 
          paymentDate: input.paymentDate 
        } 
      } 
    });
    return data.addPayment;
  }
}

// 5. createLedger
export class CreateLedgerCommand {
  async execute(input: Partial<Ledger>): Promise<Ledger> {
    const data = await gql(`
      mutation CreateLedger($input: CreateLedgerInput!) {
        createLedger(input: $input) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays
        }
      }
    `, {
      useAdmin: true,
      variables: {
        input: {
          type: input.type,
          partyName: input.partyName,
          invoiceNumber: input.invoiceNumber,
          invoiceDate: input.invoiceDate,
          amount: input.amount,
          creditDays: input.creditDays || 30
        }
      }
    });
    return data.createLedger;
  }
}
