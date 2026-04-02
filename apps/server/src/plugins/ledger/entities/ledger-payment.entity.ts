import { VendureEntity, DeepPartial } from '@vendure/core';
import { Entity, Column, ManyToOne } from 'typeorm';
import { Ledger } from './ledger.entity';

@Entity()
export class LedgerPayment extends VendureEntity {
    constructor(input?: DeepPartial<LedgerPayment>) {
        super(input);
    }

    @Column()
    amount: number;

    @Column()
    paymentDate: Date;

    @Column()
    paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CREDIT';

    @ManyToOne(type => Ledger, ledger => ledger.payments)
    ledger: Ledger;
}
