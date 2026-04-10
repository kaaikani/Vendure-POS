import { gql } from './gql';
// 1. getLedgers
export class GetLedgersQuery {
    async execute(type) {
        const data = await gql(`
      query Ledgers($type: LedgerType!) {
        ledgers(type: $type) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays contactNumber gstNumber address
          payments { id createdAt amount paymentDate paymentMode }
        }
      }
    `, { useAdmin: true, variables: { type } });
        return data.ledgers;
    }
}
// 2. getLedgerById
export class GetLedgerByIdQuery {
    async execute(id) {
        const data = await gql(`
      query Ledger($id: ID!) {
        ledger(id: $id) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays contactNumber gstNumber address
          payments { id createdAt amount paymentDate paymentMode }
        }
      }
    `, { useAdmin: true, variables: { id } });
        return data.ledger;
    }
}
// 3. summary
export class GetLedgerSummaryQuery {
    async execute() {
        const data = await gql(`
      query LedgerSummary {
        ledgerSummary { totalSales totalPurchase totalReceivable totalPayable }
      }
    `, { useAdmin: true });
        return data.ledgerSummary;
    }
}
export class AddPaymentCommand {
    async execute(ledgerId, input) {
        const data = await gql(`
      mutation AddPayment($ledgerId: ID!, $input: PaymentInput!) {
        addPayment(ledgerId: $ledgerId, input: $input) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays contactNumber gstNumber address
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
    async execute(input) {
        const data = await gql(`
      mutation CreateLedger($input: CreateLedgerInput!) {
        createLedger(input: $input) {
          id type partyName invoiceNumber invoiceDate amount paidAmount balance status creditDays contactNumber gstNumber address
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
                    creditDays: input.creditDays || 30,
                    contactNumber: input.contactNumber || '',
                    gstNumber: input.gstNumber || '',
                    address: input.address || '',
                }
            }
        });
        return data.createLedger;
    }
}
