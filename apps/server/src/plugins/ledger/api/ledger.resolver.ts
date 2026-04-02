import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { LedgerService } from '../services/ledger.service';

@Resolver('Ledger')
export class LedgerAdminResolver {
    constructor(private ledgerService: LedgerService) {}

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
    async addPayment(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.ledgerService.addPayment(ctx, args.ledgerId, args.input);
    }
}
