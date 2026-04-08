import { VendureEntity, DeepPartial } from '@vendure/core';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
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

    @Column({ nullable: true })
    ledgerId: number;

    @ManyToOne(() => Ledger, ledger => ledger.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ledgerId' })
    ledger: Ledger;
}
