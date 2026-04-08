import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Ctx, RequestContext, TransactionalConnection } from '@vendure/core';
import { LedgerService } from '../services/ledger.service';
import { Ledger } from '../entities/ledger.entity';
import { LedgerPayment } from '../entities/ledger-payment.entity';

@Resolver('Ledger')
export class LedgerAdminResolver {
    constructor(
        private ledgerService: LedgerService,
        private connection: TransactionalConnection,
    ) {}

    @Query()
    async ledgers(@Ctx() ctx: RequestContext, @Args('type') type: any) {
        return this.ledgerService.findAll(ctx, type);
    }

    @Query()
    async ledger(@Ctx() ctx: RequestContext, @Args('id') id: string) {
        return this.ledgerService.findOne(ctx, id);
    }

    @Query()
    async ledgerSummary(@Ctx() ctx: RequestContext) {
        return this.ledgerService.getSummary(ctx);
    }

    @Mutation()
    async createLedger(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.ledgerService.createLedger(ctx, args.input);
    }

    @Mutation()
    async deleteLedger(@Ctx() ctx: RequestContext, @Args('id') id: string) {
        return this.ledgerService.deleteLedger(ctx, id);
    }

    @Mutation()
    async addPayment(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.ledgerService.addPayment(ctx, args.ledgerId, args.input);
    }

    @ResolveField()
    async payments(@Ctx() ctx: RequestContext, @Parent() ledger: Ledger) {
        if (ledger.payments && ledger.payments.length > 0) {
            return ledger.payments;
        }
        return this.connection.getRepository(ctx, LedgerPayment).find({
            where: { ledger: { id: ledger.id } },
            order: { createdAt: 'DESC' },
        });
    }
}
