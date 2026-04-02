import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';
import { Ledger } from '../entities/ledger.entity';
import { LedgerPayment } from '../entities/ledger-payment.entity';

@Injectable()
export class LedgerService {
    constructor(private connection: TransactionalConnection) {}

    async createLedger(ctx: RequestContext, input: any): Promise<Ledger> {
        const ledger = new Ledger({
            ...input,
            paidAmount: 0,
            balance: input.amount,
            status: 'PENDING'
        });
        return this.connection.getRepository(ctx, Ledger).save(ledger);
    }

    async findAll(ctx: RequestContext, type: 'CUSTOMER' | 'SUPPLIER'): Promise<Ledger[]> {
        return this.connection.getRepository(ctx, Ledger).find({
            where: { type },
            relations: ['payments']
        });
    }

    async findOne(ctx: RequestContext, id: string): Promise<Ledger | null> {
        return this.connection.getRepository(ctx, Ledger).findOne({
            where: { id },
            relations: ['payments']
        });
    }

    async getSummary(ctx: RequestContext) {
        const ledgers = await this.connection.getRepository(ctx, Ledger).find();
        let summary = { 
            totalSales: 0, 
            totalPurchase: 0, 
            totalReceivable: 0, 
            totalPayable: 0 
        };

        ledgers.forEach(l => {
            if (l.type === 'CUSTOMER') {
                summary.totalSales += l.amount;
                summary.totalReceivable += l.balance;
            } else {
                summary.totalPurchase += l.amount;
                summary.totalPayable += l.balance;
            }
        });

        return summary;
    }

    async addPayment(ctx: RequestContext, ledgerId: string, input: any): Promise<Ledger> {
        const ledger = await this.connection.getEntityOrThrow(ctx, Ledger, ledgerId, { 
            relations: ['payments'] 
        });

        const payment = new LedgerPayment({
            ledger,
            amount: input.amount,
            paymentMode: input.paymentMode,
            paymentDate: input.paymentDate
        });

        await this.connection.getRepository(ctx, LedgerPayment).save(payment);

        ledger.paidAmount += input.amount;
        ledger.balance = ledger.amount - ledger.paidAmount;

        if (ledger.balance <= 0) {
            ledger.status = 'COMPLETED';
        } else if (ledger.paidAmount > 0) {
            ledger.status = 'PARTIAL';
        } else {
            ledger.status = 'PENDING';
        }

        return this.connection.getRepository(ctx, Ledger).save(ledger);
    }
}
