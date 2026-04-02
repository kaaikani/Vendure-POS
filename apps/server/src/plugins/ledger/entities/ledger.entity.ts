import { VendureEntity, DeepPartial } from '@vendure/core';
import { Entity, Column, OneToMany } from 'typeorm';
import { LedgerPayment } from './ledger-payment.entity';

@Entity()
export class Ledger extends VendureEntity {
    constructor(input?: DeepPartial<Ledger>) {
        super(input);
    }

    @Column()
    type: 'CUSTOMER' | 'SUPPLIER';

    @Column()
    partyName: string;

    @Column()
    invoiceNumber: string;

    @Column()
    invoiceDate: Date;

    @Column()
    amount: number;

    @Column()
    paidAmount: number;

    @Column()
    balance: number;

    @Column()
    status: 'PENDING' | 'PARTIAL' | 'COMPLETED';

    @Column()
    creditDays: number;

    @OneToMany(type => LedgerPayment, payment => payment.ledger)
    payments: LedgerPayment[];
}
