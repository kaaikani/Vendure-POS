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

    async deleteLedger(ctx: RequestContext, id: string): Promise<boolean> {
        const ledger = await this.connection.getEntityOrThrow(ctx, Ledger, id, {
            relations: ['payments']
        });
        if (ledger.payments.length > 0) {
            await this.connection.getRepository(ctx, LedgerPayment).remove(ledger.payments);
        }
        await this.connection.getRepository(ctx, Ledger).remove(ledger);
        return true;
    }

    async addPayment(ctx: RequestContext, ledgerId: string, input: any): Promise<Ledger> {
        const ledger = await this.connection.getEntityOrThrow(ctx, Ledger, ledgerId, { 
            relations: ['payments'] 
        });

        // Save payment via ORM
        const paymentRepo = this.connection.getRepository(ctx, LedgerPayment);
        const payment = new LedgerPayment();
        payment.amount = input.amount;
        payment.paymentMode = input.paymentMode;
        payment.paymentDate = input.paymentDate;
        payment.ledger = ledger;
        const saved = await paymentRepo.save(payment);

        // Fix ledgerId AFTER transaction commits via setTimeout
        const savedId = Number(saved.id);
        const lid = Number(ledger.id);
        setTimeout(() => {
            try {
                const path = require('path');
                const Database = require('better-sqlite3');
                const dbPath = path.join(__dirname, '..', '..', '..', '..', 'vendure.sqlite');
                const db = new Database(dbPath);
                db.prepare('UPDATE ledger_payment SET ledgerId = ? WHERE id = ?').run(lid, savedId);
                db.close();
            } catch (e) {
                console.error('[LEDGER] setTimeout fix failed:', e);
            }
        }, 500);

        ledger.paidAmount += input.amount;
        ledger.balance = ledger.amount - ledger.paidAmount;

        if (ledger.balance <= 0) {
            ledger.status = 'FULLY_PAID';
        } else if (ledger.paidAmount > 0) {
            ledger.status = 'PARTIALLY_PAID';
        } else {
            ledger.status = 'PENDING';
        }

        await this.connection.getRepository(ctx, Ledger).save(ledger);

        return this.connection.getEntityOrThrow(ctx, Ledger, ledgerId, {
            relations: ['payments']
        });
    }
}
